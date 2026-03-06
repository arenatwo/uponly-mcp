/**
 * Firebase Client SDK initialisation.
 *
 * Uses the public web config — no Admin SDK, no secrets.
 * All Firestore operations go through security rules.
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { config } from "./config.js";

const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let _auth: Auth | null = null;
let _db: Firestore | null = null;

export function getClientAuth(): Auth {
  if (!_auth) _auth = getAuth(app);
  return _auth;
}

export function getClientDb(): Firestore {
  if (!_db) _db = getFirestore(app);
  return _db;
}
