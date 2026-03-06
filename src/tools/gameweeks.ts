/**
 * Gameweek, league, and match tools (Strapi CMS — no auth needed).
 *
 * Tools: get_gameweeks, get_current_gameweek, get_gameweek,
 *        get_leagues, get_upcoming_matches, get_past_matches
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { strapiGet } from "../lib/strapi.js";

export function registerGameweekTools(server: McpServer): void {
  server.tool(
    "get_gameweeks",
    "List all gameweeks, sorted newest first.",
    {
      limit: z.number().int().positive().optional().describe("Max results (default 20)"),
    },
    async ({ limit = 20 }) => {
      const data = await strapiGet<unknown[]>("/gameweeks", {
        sort: "weekNumber:desc",
        "pagination[pageSize]": String(limit),
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_current_gameweek",
    "Get the current active or most recent gameweek with all its matches.",
    {},
    async () => {
      const data = await strapiGet<Array<{ gameweekStatus?: string; documentId: string } & Record<string, unknown>>>("/gameweeks", {
        sort: "weekNumber:desc",
        "pagination[pageSize]": "5",
      });

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No gameweeks found.");
      }

      const current =
        data.find((gw) => gw.gameweekStatus === "active") ??
        data.find((gw) => gw.gameweekStatus === "upcoming") ??
        data[0];

      const full = await strapiGet<unknown[]>("/gameweeks", {
        "filters[documentId][$eq]": current.documentId,
        "populate[matches][populate][league][populate]": "logo",
        "populate[matches][populate][team1][fields][0]": "name",
        "populate[matches][populate][team1][fields][1]": "logo",
        "populate[matches][populate][team1][fields][2]": "slug",
        "populate[matches][populate][team2][fields][0]": "name",
        "populate[matches][populate][team2][fields][1]": "logo",
        "populate[matches][populate][team2][fields][2]": "slug",
      });

      const gw = Array.isArray(full) && full.length > 0 ? full[0] : null;
      if (!gw) throw new Error("Could not load current gameweek details.");

      return { content: [{ type: "text", text: JSON.stringify(gw, null, 2) }] };
    }
  );

  server.tool(
    "get_gameweek",
    "Get a single gameweek with all matches, teams, and league info.",
    {
      gameweekId: z.string().describe("Gameweek documentId"),
    },
    async ({ gameweekId }) => {
      const data = await strapiGet<unknown[]>("/gameweeks", {
        "filters[documentId][$eq]": gameweekId,
        "populate[matches][populate][league][populate]": "logo",
        "populate[matches][populate][team1][fields][0]": "name",
        "populate[matches][populate][team1][fields][1]": "logo",
        "populate[matches][populate][team1][fields][2]": "slug",
        "populate[matches][populate][team2][fields][0]": "name",
        "populate[matches][populate][team2][fields][1]": "logo",
        "populate[matches][populate][team2][fields][2]": "slug",
      });
      const gw = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (!gw) throw new Error(`Gameweek ${gameweekId} not found`);
      return { content: [{ type: "text", text: JSON.stringify(gw, null, 2) }] };
    }
  );

  server.tool(
    "get_leagues",
    "List all leagues.",
    {},
    async () => {
      const data = await strapiGet<unknown[]>("/leagues");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_upcoming_matches",
    "Get upcoming matches for a league.",
    {
      leagueDocumentId: z.string().describe("League documentId"),
      limit: z.number().int().positive().optional().describe("Max results (default 10)"),
    },
    async ({ leagueDocumentId, limit = 10 }) => {
      const data = await strapiGet<unknown[]>("/matches", {
        "filters[league][documentId][$eq]": leagueDocumentId,
        "filters[matchStatus][$in][0]": "scheduled",
        "filters[matchStatus][$in][1]": "live",
        sort: "startTime:asc",
        "pagination[pageSize]": String(limit),
        populate: "*",
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_past_matches",
    "Get past matches for a league.",
    {
      leagueDocumentId: z.string().describe("League documentId"),
      limit: z.number().int().positive().optional().describe("Max results (default 10)"),
    },
    async ({ leagueDocumentId, limit = 10 }) => {
      const data = await strapiGet<unknown[]>("/matches", {
        "filters[league][documentId][$eq]": leagueDocumentId,
        "filters[startTime][$lt]": new Date().toISOString(),
        sort: "startTime:desc",
        "pagination[pageSize]": String(limit),
        populate: "*",
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
