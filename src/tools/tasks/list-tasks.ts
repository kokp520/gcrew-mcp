import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readTasks } from "../../storage/index.js";

export function registerListTasks(server: McpServer) {
  server.tool(
    "list_tasks",
    {},
    async () => {
      const tasks = await readTasks();
      if (tasks.length === 0) return { content: [{ type: "text", text: "No tasks currently exist" }] };

      const taskList = tasks.map(t => {
        const subtaskStatus = t.subTasks.map(st => {
          const modelInfo = st.model ? ` [${st.model}]` : "";
          return `  - [${st.status === 'completed' ? 'x' : ' '}] ${st.title} (${st.id})${modelInfo}`;
        }).join('\n');
        return `[${t.status}] ${t.goal} (${t.id})\n${subtaskStatus}`;
      }).join('\n\n');

      return { content: [{ type: "text", text: taskList }] };
    }
  );
}
