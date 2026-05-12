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
    goal: z.string().describe("The core goal of the task"),
    description: z.string().describe("Detailed description of the task"),
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
      content: [{ type: "text", text: `Main task created, ID: ${newTask.id}` }],
    };
  }
);

// Tool: Decompose task into sub-tasks
server.tool(
  "decompose_task",
  {
    taskId: z.string().describe("Main task ID"),
    subTasks: z.array(z.object({
      title: z.string(),
      description: z.string(),
      context: z.string().optional().describe("Context information for the sub-agent"),
      executionHint: z.string().optional().describe("Suggested execution environment, e.g., 'new-workspace'"),
    })).describe("List of sub-tasks"),
  },
  async ({ taskId, subTasks }) => {
    const task = await getTask(taskId);
    if (!task) return { isError: true, content: [{ type: "text", text: "Task not found" }] };

    const newSubTasks: SubTask[] = subTasks.map(st => ({
      id: Math.random().toString(36).substring(2, 11),
      title: st.title,
      description: st.description,
      status: "todo",
      context: st.context,
      executionHint: st.executionHint,
    }));

    task.subTasks.push(...newSubTasks);
    await saveTask(task);
    return {
      content: [{ type: "text", text: `Added ${newSubTasks.length} sub-tasks to task ${taskId}` }],
    };
  }
);

// Tool: List all tasks
server.tool(
  "list_tasks",
  {},
  async () => {
    const tasks = await readTasks();
    if (tasks.length === 0) return { content: [{ type: "text", text: "No tasks currently exist" }] };

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
    taskId: z.string().describe("Main task ID"),
    subTaskId: z.string().optional().describe("Sub-task ID (if updating a sub-task)"),
    status: z.enum(["todo", "in-progress", "completed", "failed"]).describe("New status"),
  },
  async ({ taskId, subTaskId, status }) => {
    const task = await getTask(taskId);
    if (!task) return { isError: true, content: [{ type: "text", text: "Task not found" }] };

    if (subTaskId) {
      const st = task.subTasks.find(s => s.id === subTaskId);
      if (!st) return { isError: true, content: [{ type: "text", text: "Sub-task not found" }] };
      st.status = status as TaskStatus;
    } else {
      task.status = status as TaskStatus;
    }

    await saveTask(task);
    return { content: [{ type: "text", text: "Status updated successfully" }] };
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

      const nextSubTask = task.subTasks.find(st => st.status === 'todo');
      if (nextSubTask) {
        return {
          content: [{
            type: "text",
            text: `Next sub-task:\nID: ${nextSubTask.id}\nMain task: ${task.goal} (${task.id})\nTitle: ${nextSubTask.title}\nDescription: ${nextSubTask.description}\nContext: ${nextSubTask.context || "None"}`
          }]
        };
      }

      if (task.status === 'todo') {
        return {
          content: [{
            type: "text",
            text: `No decomposed sub-tasks currently, but the main task is still in todo status:\nID: ${task.id}\nGoal: ${task.goal}`
          }]
        };
      }
    }

    return { content: [{ type: "text", text: "No pending tasks currently" }] };
  }
);

// Tool: Generate a launch command for a specific task
server.tool(
  "get_launch_command",
  {
    taskId: z.string().describe("Task ID"),
    subTaskId: z.string().optional().describe("Sub-task ID"),
  },
  async ({ taskId, subTaskId }) => {
    const task = await getTask(taskId);
    if (!task) return { isError: true, content: [{ type: "text", text: "Task not found" }] };

    let prompt = "";
    if (subTaskId) {
      const st = task.subTasks.find(s => s.id === subTaskId);
      if (!st) return { isError: true, content: [{ type: "text", text: "Sub-task not found" }] };
      
      let executionPrefix = "";
      if (st.executionHint) {
        executionPrefix = `[Execution Environment Hint: ${st.executionHint}]\n`;
      }

      prompt = `You are a sub-agent handling a task:\nMain task goal: ${task.goal}\nSub-task title: ${st.title}\nDescription: ${st.description}\nContext: ${st.context || "None"}\n\nPlease analyze the current situation and execute. After completion, remember to use gcrew-mcp's update_task_status tool to mark sub-task ${subTaskId} as completed.`;
      
      const escapedPrompt = prompt.replace(/'/g, "'\\''");
      const command = `gemini -i '${escapedPrompt}'`;

      return {
        content: [{
          type: "text",
          text: `${executionPrefix}Launch command:\n${command}`
        }]
      };
    } else {
      prompt = `You are a sub-agent handling a task:\nGoal: ${task.goal}\nDescription: ${task.description}\n\nPlease first decompose this task into specific sub-tasks (if not yet decomposed), and then execute.`;
      
      const escapedPrompt = prompt.replace(/'/g, "'\\''");
      const command = `gemini -i '${escapedPrompt}'`;

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
