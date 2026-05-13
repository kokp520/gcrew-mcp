import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getTask } from "../../storage/index.js";

export function registerGetLaunchCommand(server: McpServer) {
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

        // Collect dependency results
        let dependencyResults = "";
        if (st.dependsOn && st.dependsOn.length > 0) {
          const results = st.dependsOn
            .map(depId => task.subTasks.find(s => s.id === depId))
            .filter(dep => dep && dep.status === 'completed' && dep.result)
            .map(dep => `### Prerequisite task result: ${dep!.title} (${dep!.id})\n${dep!.result}`)
            .join('\n\n');
          
          if (results) {
            dependencyResults = `\n\n## Dependent Task Results\n${results}`;
          }
        }

        prompt = `You are a sub-agent handling a task:\nMain task goal: ${task.goal}\nSub-task title: ${st.title}\nDescription: ${st.description}\nContext: ${st.context || "None"}${dependencyResults}\n\nPlease analyze the current situation and execute. After completion, remember to use gcrew-mcp's update_task_status tool to mark sub-task ${subTaskId} as completed.`;
        
        const escapedPrompt = prompt.replace(/'/g, "'\\''");
        const modelFlag = st.model ? `-m ${st.model} ` : "";
        const command = `gemini ${modelFlag}-i '${escapedPrompt}'`;

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
}
