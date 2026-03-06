#!/usr/bin/env node
/**
 * Entry point for the external Up Only MCP server.
 *
 * Usage:
 *   npx @arenatwo/uponly-mcp       → stdio transport (for Claude Desktop / VS Code)
 *   node dist/index.js --http      → HTTP/SSE transport
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { AuthStateStore } from "./lib/auth-state.js";

async function main() {
  const mcpServer = createServer(new AuthStateStore());
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("[uponly-mcp] Running on stdio transport");
}

main().catch((err) => {
  console.error("[uponly-mcp] Fatal error:", err);
  process.exit(1);
});
