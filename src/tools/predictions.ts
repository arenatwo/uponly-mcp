/**
 * Prediction tools using Firebase Client SDK.
 *
 * All writes go through Firestore security rules (user can only write own data).
 * Leaderboard stubs are created by the onPredictionCreate Cloud Function trigger.
 *
 * Tools: get_prediction, get_user_predictions, submit_prediction,
 *        lock_prediction, lock_all_predictions
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  doc, getDoc, getDocs, setDoc, updateDoc, writeBatch,
  collection, query, where, limit as firestoreLimit,
  serverTimestamp, increment,
} from "firebase/firestore";
import { getClientDb } from "../lib/firebase.js";
import { AuthStateStore } from "../lib/auth-state.js";
import { strapiGet } from "../lib/strapi.js";

const WinnerEnum = z
  .enum(["home", "away", "draw"])
  .describe("Predicted match outcome");

export function registerPredictionTools(server: McpServer, store: AuthStateStore): void {
  server.tool(
    "get_prediction",
    "Get your prediction for a specific fixture. Requires authentication.",
    {
      fixtureId: z.string().describe("Fixture ID"),
    },
    async ({ fixtureId }) => {
      const auth = store.require();
      const db = getClientDb();
      const snap = await getDoc(doc(db, "predictions", `${auth.uid}_${fixtureId}`));
      if (!snap.exists()) {
        return { content: [{ type: "text", text: "No prediction found." }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(snap.data(), null, 2) }] };
    }
  );

  server.tool(
    "get_user_predictions",
    "Get all your predictions, optionally filtered by gameweek. Requires authentication.",
    {
      gameweekId: z.string().optional().describe("Filter by gameweek ID"),
      limit: z.number().int().positive().optional().describe("Max results (default 50)"),
    },
    async ({ gameweekId, limit = 50 }) => {
      const auth = store.require();
      const db = getClientDb();
      const constraints = [where("userId", "==", auth.uid)];
      if (gameweekId) constraints.push(where("gameweekId", "==", gameweekId));
      const q = query(collection(db, "predictions"), ...constraints, firestoreLimit(limit));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => d.data());
      return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
    }
  );

  server.tool(
    "submit_prediction",
    "Submit or update a prediction for a fixture. Requires authentication.",
    {
      fixtureId: z.string().describe("Fixture ID"),
      gameweekId: z.string().describe("Gameweek documentId"),
      winner: WinnerEnum,
      scoreHome: z.number().int().nonnegative().optional().describe("Predicted home score"),
      scoreAway: z.number().int().nonnegative().optional().describe("Predicted away score"),
    },
    async ({ fixtureId, gameweekId, winner, scoreHome, scoreAway }) => {
      const auth = store.require();
      const db = getClientDb();

      // Kickoff guard
      try {
        const matchData = await strapiGet<unknown[]>("/matches", {
          "filters[documentId][$eq]": fixtureId,
          "fields[0]": "matchStatus",
          "fields[1]": "startTime",
        });
        const match = Array.isArray(matchData) && matchData.length > 0
          ? (matchData[0] as { matchStatus?: string; startTime?: string })
          : null;
        if (match) {
          if (match.matchStatus === "live" || match.matchStatus === "finished") {
            throw new Error(`Cannot submit prediction: match is already ${match.matchStatus}.`);
          }
          if (match.startTime && new Date(match.startTime).getTime() <= Date.now()) {
            throw new Error("Cannot submit prediction: match kickoff time has passed.");
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message.startsWith("Cannot submit")) throw err;
        throw new Error(
          `Cannot submit prediction: kickoff status could not be verified (${(err as Error)?.message ?? "unknown"}).`
        );
      }

      const docId = `${auth.uid}_${fixtureId}`;
      const docRef = doc(db, "predictions", docId);

      // Lock guard
      const existing = await getDoc(docRef);
      if (existing.exists() && existing.data()?.isLocked === true) {
        throw new Error("Prediction is already locked and cannot be changed.");
      }

      const isNew = !existing.exists();
      const prediction: Record<string, unknown> = {
        userId: auth.uid,
        fixtureId,
        gameweekId,
        winner,
        updatedAt: serverTimestamp(),
      };
      if (scoreHome !== undefined) prediction.scoreHome = scoreHome;
      if (scoreAway !== undefined) prediction.scoreAway = scoreAway;

      const batch = writeBatch(db);
      batch.set(docRef, prediction, { merge: true });
      if (isNew) {
        batch.update(doc(db, "users", auth.uid), {
          [`predictionUsage.${gameweekId}`]: increment(1),
        });
      }
      await batch.commit();

      // Leaderboard stubs are created by the onPredictionCreate Cloud Function.

      return {
        content: [{ type: "text", text: `Prediction saved: ${docId}` }],
      };
    }
  );

  server.tool(
    "lock_prediction",
    "Lock a prediction so it can no longer be changed. Requires authentication.",
    {
      fixtureId: z.string().describe("Fixture ID to lock"),
    },
    async ({ fixtureId }) => {
      const auth = store.require();
      const db = getClientDb();
      const docId = `${auth.uid}_${fixtureId}`;
      const docRef = doc(db, "predictions", docId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error(`No prediction found for fixture ${fixtureId}`);
      await updateDoc(docRef, { isLocked: true, lockedAt: serverTimestamp() });
      return { content: [{ type: "text", text: `Prediction ${docId} locked.` }] };
    }
  );

  server.tool(
    "lock_all_predictions",
    "Lock all unlocked predictions for a gameweek. Requires authentication.",
    {
      gameweekId: z.string().describe("Gameweek ID"),
    },
    async ({ gameweekId }) => {
      const auth = store.require();
      const db = getClientDb();

      const q = query(
        collection(db, "predictions"),
        where("userId", "==", auth.uid),
        where("gameweekId", "==", gameweekId)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        return { content: [{ type: "text", text: "No predictions found for this gameweek." }] };
      }

      const unlocked = snap.docs.filter((d) => d.data().isLocked !== true);
      if (unlocked.length === 0) {
        return { content: [{ type: "text", text: "All predictions are already locked." }] };
      }

      const batch = writeBatch(db);
      for (const d of unlocked) {
        batch.update(d.ref, { isLocked: true, lockedAt: serverTimestamp() });
      }

      // Write gameweek_status
      const statusRef = doc(db, "gameweek_status", `${auth.uid}_${gameweekId}`);
      batch.set(statusRef, {
        userId: auth.uid,
        gameweekId,
        isLocked: true,
        lockedAt: serverTimestamp(),
      });

      await batch.commit();
      return { content: [{ type: "text", text: `Locked ${unlocked.length} prediction(s) for gameweek ${gameweekId}.` }] };
    }
  );
}
