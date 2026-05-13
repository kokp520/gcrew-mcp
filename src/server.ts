import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAllTools } from "./tools/index.js";

export class GcrewMcpServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: "gcrew-tasker",
      version: "1.0.0",
    });
    this.registerTools();
  }

  private registerTools() {
    registerAllTools(this.server);
  }

  public getInternalServer(): McpServer {
    return this.server;
  }
}
