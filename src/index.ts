#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readTasks, saveTask, getTask } from "./storage.js";
import type { Task, SubTask, TaskStatus } from "./types.js";

const server = new McpServer({
  name: "gcrew-tasker",
  version: "1.0.0",
});

// Tool: Create a new high-level task
server.tool(
  "create_main_task",
  {
    goal: z.string().describe("任務的核心目標"),
    description: z.string().describe("任務的詳細描述"),
  },
  async ({ goal, description }) => {
    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 11),
      goal,
      description,
      status: "todo",
      subTasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveTask(newTask);
    return {
      content: [{ type: "text", text: `主任務已建立，ID: ${newTask.id}` }],
    };
  }
);

// Tool: Decompose task into sub-tasks
server.tool(
  "decompose_task",
  {
    taskId: z.string().describe("主任務 ID"),
    subTasks: z.array(z.object({
      title: z.string(),
      description: z.string(),
      context: z.string().optional().describe("提供給子 agent 的上下文資訊"),
      executionHint: z.string().optional().describe("建議的執行環境，例如 'new-workspace'"),
      dependsOn: z.array(z.string()).optional().describe("依賴的子任務 ID 清單"),
    })).describe("子任務清單"),
  },
  async ({ taskId, subTasks }) => {
    const task = await getTask(taskId);
    if (!task) return { isError: true, content: [{ type: "text", text: "找不到該任務" }] };

    const newSubTasks: SubTask[] = subTasks.map(st => ({
      id: Math.random().toString(36).substring(2, 11),
      title: st.title,
      description: st.description,
      status: "todo",
      context: st.context,
      executionHint: st.executionHint,
      dependsOn: st.dependsOn || [],
    }));

    task.subTasks.push(...newSubTasks);
    await saveTask(task);
    return {
      content: [{ type: "text", text: `已為任務 ${taskId} 新增 ${newSubTasks.length} 個子任務` }],
    };
  }
);

// Tool: List all tasks
server.tool(
  "list_tasks",
  {},
  async () => {
    const tasks = await readTasks();
    if (tasks.length === 0) return { content: [{ type: "text", text: "目前沒有任何任務" }] };

    const taskList = tasks.map(t => {
      const subtaskStatus = t.subTasks.map(st => `  - [${st.status === 'completed' ? 'x' : ' '}] ${st.title} (${st.id})`).join('\n');
      return `[${t.status}] ${t.goal} (${t.id})\n${subtaskStatus}`;
    }).join('\n\n');

    return { content: [{ type: "text", text: taskList }] };
  }
);

// Tool: Update task or subtask status
server.tool(
  "update_task_status",
  {
    taskId: z.string().describe("主任務 ID"),
    subTaskId: z.string().optional().describe("子任務 ID (如果要更新子任務)"),
    status: z.enum(["todo", "in-progress", "completed", "failed"]).describe("新狀態"),
    result: z.string().optional().describe("執行結果 (當狀態為 completed 時提供)"),
  },
  async ({ taskId, subTaskId, status, result }) => {
    const task = await getTask(taskId);
    if (!task) return { isError: true, content: [{ type: "text", text: "找不到該任務" }] };

    if (subTaskId) {
      const st = task.subTasks.find(s => s.id === subTaskId);
      if (!st) return { isError: true, content: [{ type: "text", text: "找不到該子任務" }] };
      st.status = status as TaskStatus;
      if (status === "completed" && result) {
        st.result = result;
      }
    } else {
      task.status = status as TaskStatus;
    }

    await saveTask(task);

    // Calculate progress
    const totalSubTasks = task.subTasks.length;
    const completedSubTasks = task.subTasks.filter(st => st.status === "completed").length;
    let progressMessage = "";
    if (totalSubTasks > 0) {
      const percentage = Math.round((completedSubTasks / totalSubTasks) * 100);
      progressMessage = `。任務進度: ${percentage}% (${completedSubTasks}/${totalSubTasks})`;
    }

    return { content: [{ type: "text", text: `狀態更新成功${progressMessage}` }] };
  }
);

// Tool: Get the next task to perform
server.tool(
  "get_next_task",
  {},
  async () => {
    const tasks = await readTasks();
    for (const task of tasks) {
      if (task.status === 'completed' || task.status === 'failed') continue;

      const nextSubTask = task.subTasks.find(st => {
        if (st.status !== 'todo') return false;
        
        // Check dependencies: all dependencies must be completed
        if (st.dependsOn && st.dependsOn.length > 0) {
          return st.dependsOn.every(depId => {
            const depTask = task.subTasks.find(s => s.id === depId);
            return depTask && depTask.status === 'completed';
          });
        }
        
        return true;
      });

      if (nextSubTask) {
        return {
          content: [{
            type: "text",
            text: `下一個子任務:\nID: ${nextSubTask.id}\n主任務: ${task.goal} (${task.id})\n標題: ${nextSubTask.title}\n描述: ${nextSubTask.description}\n上下文: ${nextSubTask.context || "無"}`
          }]
        };
      }

      if (task.status === 'todo' && task.subTasks.length === 0) {
        return {
          content: [{
            type: "text",
            text: `目前沒有已分解的子任務，但主任務仍然是 todo 狀態:\nID: ${task.id}\n目標: ${task.goal}`
          }]
        };
      }
    }

    return { content: [{ type: "text", text: "目前沒有待辦任務" }] };
  }
);

// Tool: Generate a launch command for a specific task
server.tool(
  "get_launch_command",
  {
    taskId: z.string().describe("任務 ID"),
    subTaskId: z.string().optional().describe("子任務 ID"),
    useCmux: z.boolean().optional().default(false).describe("是否使用 cmux 包裝指令"),
  },
  async ({ taskId, subTaskId, useCmux }) => {
    const task = await getTask(taskId);
    if (!task) return { isError: true, content: [{ type: "text", text: "找不到該任務" }] };

    let prompt = "";
    let title = "";

    if (subTaskId) {
      const st = task.subTasks.find(s => s.id === subTaskId);
      if (!st) return { isError: true, content: [{ type: "text", text: "找不到該子任務" }] };
      
      title = `Task: ${st.title}`;
      let executionPrefix = "";
      if (st.executionHint) {
        executionPrefix = `【執行環境建議：${st.executionHint}】\n`;
      }

      // Collect dependency results
      let dependencyResults = "";
      if (st.dependsOn && st.dependsOn.length > 0) {
        const results = st.dependsOn
          .map(depId => task.subTasks.find(s => s.id === depId))
          .filter(dep => dep && dep.status === 'completed' && dep.result)
          .map(dep => `### 前置任務結果：${dep!.title} (${dep!.id})\n${dep!.result}`)
          .join('\n\n');
        
        if (results) {
          dependencyResults = `\n\n## 依賴任務執行結果\n${results}`;
        }
      }

      prompt = `你現在是子 Agent，正在處理任務：\n主任務目標：${task.goal}\n子任務標題：${st.title}\n描述：${st.description}\n上下文：${st.context || "無"}${dependencyResults}\n\n請先分析現狀，然後開始執行。執行完畢後，請記得使用 gcrew-mcp 的 update_task_status 工具將子任務 ${subTaskId} 標記為 completed。`;
      
      const escapedPrompt = prompt.replace(/'/g, "'\\''");
      let command = `gemini -i '${escapedPrompt}'`;

      if (useCmux) {
        command = `cmux new-workspace --title "${title.replace(/"/g, '\\"')}" --command "${command.replace(/"/g, '\\"')}"`;
      }

      return {
        content: [{
          type: "text",
          text: `${executionPrefix}啟動指令：\n${command}`
        }]
      };
    } else {
      title = `Task Decomposition: ${task.id}`;
      prompt = `你現在是子 Agent，正在處理任務：\n目標：${task.goal}\n描述：${task.description}\n\n請先將此任務分解為具體的子任務（如果尚未分解），然後開始執行。`;
      
      const escapedPrompt = prompt.replace(/'/g, "'\\''");
      let command = `gemini -i '${escapedPrompt}'`;

      if (useCmux) {
        command = `cmux new-workspace --title "${title.replace(/"/g, '\\"')}" --command "${command.replace(/"/g, '\\"')}"`;
      }

      return {
        content: [{
          type: "text",
          text: command
        }]
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gcrew Tasker MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
