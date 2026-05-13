import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getTask, saveTask } from "../../storage/index.js";
import { generateId } from "../../utils/id.js";
import { autoAssignModel } from "../../utils/model.js";
import type { SubTask } from "../../types/index.js";

export function registerDecomposeTask(server: McpServer) {
  server.tool(
    "decompose_task",
    {
      taskId: z.string().describe("Main task ID"),
      subTasks: z.array(z.object({
        title: z.string(),
        description: z.string(),
        model: z.string().optional().describe("Model to use for this sub-task, e.g., 'gemini-1.5-flash'"),
        context: z.string().optional().describe("Context information for the sub-agent"),
        executionHint: z.string().optional().describe("Suggested execution environment, e.g., 'new-workspace'"),
        dependsOn: z.array(z.string()).optional().describe("List of dependent sub-task IDs"),
      })).describe("List of sub-tasks"),
    },
    async ({ taskId, subTasks }) => {
      const task = await getTask(taskId);
      if (!task) return { isError: true, content: [{ type: "text", text: "Task not found" }] };

      const newSubTasks: SubTask[] = subTasks.map(st => {
        let selectedModel = st.model || autoAssignModel(st.title, st.description, st.context);

        return {
          id: generateId(),
          title: st.title,
          description: st.description,
          status: "todo",
          model: selectedModel,
          context: st.context,
          executionHint: st.executionHint,
          dependsOn: st.dependsOn || [],
        };
      });

      task.subTasks.push(...newSubTasks);
      await saveTask(task);
      return {
        content: [{ type: "text", text: `Added ${newSubTasks.length} sub-tasks to task ${taskId}` }],
      };
    }
  );
}
