/**
 * Configuration for the external Up Only MCP server.
 *
 * Uses only public Firebase config (same values embedded in the web app).
 * No secrets, no Admin SDK, no service account.
 */

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const config = {
  strapi: {
    url: optional("STRAPI_URL", "https://strapi.arenatwo.com/api"),
  },
  season: optional("SEASON_ID", "season_24"),
  firebase: {
    apiKey: optional("FIREBASE_API_KEY", "AIzaSyAZ7iBZ4VzVfnkJbGMaQ_oFGfBMOvNNvkI"),
    authDomain: optional("FIREBASE_AUTH_DOMAIN", "arenatwocom.firebaseapp.com"),
    projectId: optional("FIREBASE_PROJECT_ID", "arenatwocom"),
    storageBucket: optional("FIREBASE_STORAGE_BUCKET", "arenatwocom.firebasestorage.app"),
    messagingSenderId: optional("FIREBASE_MESSAGING_SENDER_ID", "792839837498"),
    appId: optional("FIREBASE_APP_ID", "1:792839837498:web:73b44c3c3e72c1f2adc8f1"),
  },
};
