/**
 * MCP Server definition for the external Up Only MCP.
 * Uses Firebase Client SDK — no secrets, no Admin SDK.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AuthStateStore } from "./lib/auth-state.js";
import { registerAuthTools } from "./tools/auth.js";
import { registerGameweekTools } from "./tools/gameweeks.js";
import { registerPredictionTools } from "./tools/predictions.js";
import { registerLeaderboardTools } from "./tools/leaderboard.js";
import { registerInfoTools } from "./tools/info.js";

export function createServer(store?: AuthStateStore): McpServer {
  const authStore = store ?? new AuthStateStore();

  const server = new McpServer(
    {
      name: "uponly-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  registerAuthTools(server, authStore);
  registerGameweekTools(server);
  registerPredictionTools(server, authStore);
  registerLeaderboardTools(server, authStore);
  registerInfoTools(server);

  return server;
}
