/**
 * Static informational tools for the Up Only platform.
 *
 * Tools: get_uponly_info
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { strapiGet } from "../lib/strapi.js";

const RULES_TEXT = `
# UP ONLY — Rules & How to Play

## Overview
Up Only is a free-to-play football prediction game. You predict the outcome of
matches across multiple competitions every gameweek. Points are awarded after
the real matches finish.

## How to Make Predictions
1. Each gameweek contains a set of scheduled fixtures.
2. For each fixture you can predict:
   - **Winner** (home win / draw / away win) — required
   - **Exact score** (home goals : away goals) — optional, earns bonus points
3. You must submit (and optionally lock) your predictions BEFORE the match kicks off.
4. Predictions are automatically rejected after the match start time.

## Locking Predictions
- Predictions can be **locked** individually or all at once via "lock all".
- A locked prediction **cannot be changed**. Lock when you're confident.
- You do not have to lock — unlocked predictions are still scored normally.

## Scoring
| Result | Points |
|--------|--------|
| Correct match outcome (home / draw / away) | **+2 pts** |
| Exact correct score (e.g. predicted 2-1, actual 2-1) | **+3 pts** (total 5 for that fixture) |
| Wrong outcome | 0 pts |

**Tiebreaker** (when players are level on points):
1. Most exact scores
2. Most correct winners
3. Earliest prediction submission time

## Gameweek Structure
- A gameweek typically spans Mon–Sun and groups a set of fixtures.
- Weekly leaderboard: points earned in that specific gameweek.
- Season (overall) leaderboard: cumulative points across all gameweeks in the season.
`;

const SCORING_TEXT = `
# UP ONLY — Scoring System

## Per-Fixture Points
- **Correct outcome only** (e.g. you said "home", real result was home win): **+2 pts**
- **Correct exact score** (e.g. you said "2-1", real score was 2-1): **+3 pts**
  - The outcome is also correct in this case, so total = **5 pts** for that fixture.
- **Wrong outcome**: 0 pts.

## Tiebreaker (in order)
1. Number of exact scores predicted
2. Number of correct outcomes
3. Earliest submission timestamp of all predictions in the gameweek

## Season Score
- All weekly points accumulate into a season total.
- There is no reset between gameweeks within a season.
`;

export function registerInfoTools(server: McpServer): void {
  server.tool(
    "get_uponly_info",
    "Get the Up Only platform guide: rules, scoring system, and supported leagues.",
    {
      topic: z
        .enum(["all", "rules", "scoring", "leagues"])
        .optional()
        .describe("Section: 'rules', 'scoring', 'leagues', or 'all' (default)"),
    },
    async ({ topic = "all" }) => {
      const parts: string[] = [];

      if (topic === "all" || topic === "rules") parts.push(RULES_TEXT);
      if (topic === "all" || topic === "scoring") parts.push(SCORING_TEXT);

      if (topic === "all" || topic === "leagues") {
        try {
          const leagues = await strapiGet<Array<Record<string, unknown>>>("/leagues");
          const active = Array.isArray(leagues)
            ? leagues.filter(
                (l) => l.leagueStatus === "active" || l.leagueStatus === "registration_open" || l.leagueStatus === "upcoming"
              )
            : leagues;
          const lines = Array.isArray(active)
            ? active.map((l) => `- **${l.name}** (${l.leagueStatus ?? "unknown"}) | ${l.description ?? ""}`).join("\n")
            : JSON.stringify(active, null, 2);
          parts.push(`\n# Supported Leagues\n\n${lines}`);
        } catch {
          parts.push("\n# Supported Leagues\n\nCould not fetch live league data. Use get_leagues tool.");
        }
      }

      return { content: [{ type: "text", text: parts.join("\n\n---\n\n") }] };
    }
  );
}
