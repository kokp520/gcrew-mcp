import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { saveTask } from "../../storage/index.js";
import { generateId } from "../../utils/id.js";
import type { Task } from "../../types/index.js";

export function registerCreateMainTask(server: McpServer) {
  server.tool(
    "create_main_task",
    {
      goal: z.string().describe("The core goal of the task"),
      description: z.string().describe("Detailed description of the task"),
    },
    async ({ goal, description }) => {
      const newTask: Task = {
        id: generateId(),
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
}
