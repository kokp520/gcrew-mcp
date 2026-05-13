import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCreateMainTask } from "./tasks/create-main-task.js";
import { registerDecomposeTask } from "./tasks/decompose-task.js";
import { registerListTasks } from "./tasks/list-tasks.js";
import { registerUpdateTaskStatus } from "./tasks/update-task-status.js";
import { registerGetNextTask } from "./tasks/get-next-task.js";
import { registerGetLaunchCommand } from "./tasks/get-launch-command.js";

export function registerAllTools(server: McpServer) {
  registerCreateMainTask(server);
  registerDecomposeTask(server);
  registerListTasks(server);
  registerUpdateTaskStatus(server);
  registerGetNextTask(server);
  registerGetLaunchCommand(server);
}
