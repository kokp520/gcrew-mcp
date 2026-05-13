#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GcrewMcpServer } from "./server.js";

async function main() {
  const gcrewServer = new GcrewMcpServer();
  const transport = new StdioServerTransport();
  
  await gcrewServer.getInternalServer().connect(transport);
  console.error("Gcrew Tasker MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
