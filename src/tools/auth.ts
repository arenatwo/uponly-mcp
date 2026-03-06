/**
 * Auth tools using Firebase Client SDK (email/password only).
 *
 * Tools: auth_login_email, auth_signup_email, auth_whoami, auth_logout
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getClientAuth, getClientDb } from "../lib/firebase.js";
import { AuthStateStore } from "../lib/auth-state.js";

export function registerAuthTools(server: McpServer, store: AuthStateStore): void {
  server.tool(
    "auth_login_email",
    "Sign in with email and password.",
    {
      email: z.string().email().describe("Email address"),
      password: z.string().min(6).describe("Password"),
    },
    async ({ email, password }) => {
      const auth = getClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      store.setUser(cred.user);
      return {
        content: [{
          type: "text",
          text: `Signed in as ${cred.user.email} (uid: ${cred.user.uid})`,
        }],
      };
    }
  );

  server.tool(
    "auth_signup_email",
    "Create a new account with email and password.",
    {
      email: z.string().email().describe("Email address"),
      password: z.string().min(6).describe("Password (min 6 chars)"),
      displayName: z.string().optional().describe("Display name"),
    },
    async ({ email, password, displayName }) => {
      const auth = getClientAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }

      // Create user profile in Firestore (mirrors what the auth trigger does,
      // but ensures it exists immediately for the MCP session)
      const db = getClientDb();
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: displayName || "",
        photoURL: cred.user.photoURL || "",
        seasonPoints: 0,
      }, { merge: true });

      store.setUser(cred.user);
      return {
        content: [{
          type: "text",
          text: `Account created: ${cred.user.email} (uid: ${cred.user.uid})`,
        }],
      };
    }
  );

  server.tool(
    "auth_whoami",
    "Show the currently authenticated user.",
    {},
    async () => {
      const user = store.getUser();
      if (!user) {
        return { content: [{ type: "text", text: "Not signed in." }] };
      }
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "auth_logout",
    "Sign out the current user.",
    {},
    async () => {
      const auth = getClientAuth();
      await signOut(auth);
      store.clear();
      return { content: [{ type: "text", text: "Signed out." }] };
    }
  );
}
