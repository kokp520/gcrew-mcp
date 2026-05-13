import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readTasks } from "../../storage/index.js";

export function registerGetNextTask(server: McpServer) {
  server.tool(
    "get_next_task",
    {
      taskId: z.string().optional().describe("Optional: Focus on a specific task ID"),
    },
    async ({ taskId }) => {
      const tasks = await readTasks();
      const filteredTasks = taskId ? tasks.filter(t => t.id === taskId) : tasks;

      for (const task of filteredTasks) {
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
              text: `Next sub-task:\nID: ${nextSubTask.id}\nMain task: ${task.goal} (${task.id})\nTitle: ${nextSubTask.title}\nDescription: ${nextSubTask.description}\nModel: ${nextSubTask.model || "Default"}\nContext: ${nextSubTask.context || "None"}`
            }]
          };
        }

        if (task.status === 'todo' && task.subTasks.length === 0) {
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
}
