/**
 * Leaderboard tools (read-only from Firestore via Client SDK).
 *
 * Tools: get_weekly_leaderboard, get_overall_leaderboard,
 *        get_my_leaderboard_position, get_my_score, get_my_gameweek_status
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  collection, doc, getDoc, getDocs, query, orderBy, limit as firestoreLimit, where, getCountFromServer,
} from "firebase/firestore";
import { getClientDb } from "../lib/firebase.js";
import { AuthStateStore } from "../lib/auth-state.js";
import { config } from "../lib/config.js";

export function registerLeaderboardTools(server: McpServer, store: AuthStateStore): void {
  server.tool(
    "get_weekly_leaderboard",
    "Get standings for a specific gameweek.",
    {
      gameweekId: z.string().describe("Gameweek ID"),
      limit: z.number().int().positive().optional().describe("Max entries (default 50)"),
    },
    async ({ gameweekId, limit = 50 }) => {
      const db = getClientDb();
      const q = query(
        collection(db, `weekly_leaderboards/${gameweekId}/standings`),
        orderBy("totalPoints", "desc"),
        firestoreLimit(limit)
      );
      let snap;
      try {
        snap = await getDocs(q);
      } catch {
        // Index might not exist — fall back to unordered
        snap = await getDocs(query(
          collection(db, `weekly_leaderboards/${gameweekId}/standings`),
          firestoreLimit(limit)
        ));
      }

      let prevPoints: number | null = null;
      let prevRank = 0;
      const standings = snap.docs.map((d, i) => {
        const data = d.data() as { totalPoints?: number };
        const pts = typeof data.totalPoints === "number" ? data.totalPoints : 0;
        const rank = prevPoints === null ? 1 : pts === prevPoints ? prevRank : i + 1;
        prevPoints = pts;
        prevRank = rank;
        return { rank, ...data };
      });

      return { content: [{ type: "text", text: JSON.stringify(standings, null, 2) }] };
    }
  );

  server.tool(
    "get_overall_leaderboard",
    "Get overall season standings.",
    {
      limit: z.number().int().positive().optional().describe("Max entries (default 100)"),
    },
    async ({ limit = 100 }) => {
      const db = getClientDb();
      const q = query(
        collection(db, `overall_leaderboard/${config.season}/standings`),
        orderBy("overallPoints", "desc"),
        firestoreLimit(limit)
      );
      let snap;
      try {
        snap = await getDocs(q);
      } catch {
        snap = await getDocs(query(
          collection(db, `overall_leaderboard/${config.season}/standings`),
          firestoreLimit(limit)
        ));
      }

      let prevPoints: number | null = null;
      let prevRank = 0;
      const standings = snap.docs.map((d, i) => {
        const data = d.data() as { overallPoints?: number };
        const pts = typeof data.overallPoints === "number" ? data.overallPoints : 0;
        const rank = prevPoints === null ? 1 : pts === prevPoints ? prevRank : i + 1;
        prevPoints = pts;
        prevRank = rank;
        return { rank, ...data };
      });

      return { content: [{ type: "text", text: JSON.stringify(standings, null, 2) }] };
    }
  );

  server.tool(
    "get_my_leaderboard_position",
    "Get your position in the weekly and overall leaderboards. Requires authentication.",
    {
      gameweekId: z.string().describe("Gameweek ID"),
    },
    async ({ gameweekId }) => {
      const auth = store.require();
      const db = getClientDb();

      const [weeklySnap, overallSnap] = await Promise.all([
        getDoc(doc(db, `weekly_leaderboards/${gameweekId}/standings/${auth.uid}`)),
        getDoc(doc(db, `overall_leaderboard/${config.season}/standings/${auth.uid}`)),
      ]);

      let weeklyRank: number | null = null;
      if (weeklySnap.exists()) {
        const myPts = (weeklySnap.data()?.totalPoints as number) ?? 0;
        const above = await getCountFromServer(
          query(
            collection(db, `weekly_leaderboards/${gameweekId}/standings`),
            where("totalPoints", ">", myPts)
          )
        );
        weeklyRank = above.data().count + 1;
      }

      let overallRank: number | null = null;
      if (overallSnap.exists()) {
        const myPts = (overallSnap.data()?.overallPoints as number) ?? 0;
        const above = await getCountFromServer(
          query(
            collection(db, `overall_leaderboard/${config.season}/standings`),
            where("overallPoints", ">", myPts)
          )
        );
        overallRank = above.data().count + 1;
      }

      const result = {
        uid: auth.uid,
        displayName: auth.displayName,
        weekly: weeklySnap.exists()
          ? {
              rank: weeklyRank,
              totalPoints: weeklySnap.data()?.totalPoints ?? 0,
              exactScoreCount: weeklySnap.data()?.exactScoreCount ?? 0,
              winnerCount: weeklySnap.data()?.winnerCount ?? 0,
            }
          : { rank: null, message: "No weekly entry yet." },
        overall: overallSnap.exists()
          ? {
              rank: overallRank,
              overallPoints: overallSnap.data()?.overallPoints ?? 0,
              overallExactScores: overallSnap.data()?.overallExactScores ?? 0,
            }
          : { rank: null, message: "No overall entry yet." },
      };

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_my_score",
    "Get your points for a specific gameweek and overall season score. Requires authentication.",
    {
      gameweekId: z.string().describe("Gameweek ID"),
    },
    async ({ gameweekId }) => {
      const auth = store.require();
      const db = getClientDb();

      const [weeklySnap, userSnap, overallSnap] = await Promise.all([
        getDoc(doc(db, `weekly_leaderboards/${gameweekId}/standings/${auth.uid}`)),
        getDoc(doc(db, `users/${auth.uid}`)),
        getDoc(doc(db, `overall_leaderboard/${config.season}/standings/${auth.uid}`)),
      ]);

      const weeklyData = weeklySnap.data();
      const userData = userSnap.data();
      const overallData = overallSnap.data();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            uid: auth.uid,
            displayName: auth.displayName,
            gameweek: {
              gameweekId,
              points: weeklyData?.totalPoints ?? 0,
              correctWinners: weeklyData?.winnerCount ?? 0,
              exactScores: weeklyData?.exactScoreCount ?? 0,
              status: weeklySnap.exists() ? "found" : "no entry",
            },
            season: {
              overallPoints: overallData?.overallPoints ?? 0,
              overallExactScores: overallData?.overallExactScores ?? 0,
              predictionUsage: userData?.predictionUsage ?? {},
            },
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "get_my_gameweek_status",
    "Get prediction lock status for a gameweek. Requires authentication.",
    {
      gameweekId: z.string().describe("Gameweek ID"),
    },
    async ({ gameweekId }) => {
      const auth = store.require();
      const db = getClientDb();
      const snap = await getDoc(doc(db, "gameweek_status", `${auth.uid}_${gameweekId}`));
      if (!snap.exists()) {
        return { content: [{ type: "text", text: `No lock status found for gameweek ${gameweekId}.` }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(snap.data(), null, 2) }] };
    }
  );
}
