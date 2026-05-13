import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getTask, saveTask } from "../../storage/index.js";
import type { TaskStatus } from "../../types/index.js";

export function registerUpdateTaskStatus(server: McpServer) {
  server.tool(
    "update_task_status",
    {
      taskId: z.string().describe("Main task ID"),
      subTaskId: z.string().optional().describe("Sub-task ID (if updating a sub-task)"),
      status: z.enum(["todo", "in-progress", "completed", "failed"]).describe("New status"),
      result: z.string().optional().describe("Execution result (provided when status is completed)"),
    },
    async ({ taskId, subTaskId, status, result }) => {
      const task = await getTask(taskId);
      if (!task) return { isError: true, content: [{ type: "text", text: "Task not found" }] };

      if (subTaskId) {
        const st = task.subTasks.find(s => s.id === subTaskId);
        if (!st) return { isError: true, content: [{ type: "text", text: "Sub-task not found" }] };
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
        progressMessage = `. Task progress: ${percentage}% (${completedSubTasks}/${totalSubTasks})`;
      }

      return { content: [{ type: "text", text: `Status updated successfully${progressMessage}` }] };
    }
  );
}
