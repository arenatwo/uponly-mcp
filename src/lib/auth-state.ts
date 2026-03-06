/**
 * Per-session auth state for the external MCP server.
 *
 * Wraps Firebase Client SDK auth state so tools can call store.require()
 * to get the current user or throw if not logged in.
 */

import { User } from "firebase/auth";

export interface AuthInfo {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export class AuthStateStore {
  private _user: User | null = null;

  setUser(user: User | null): void {
    this._user = user;
  }

  getUser(): User | null {
    return this._user;
  }

  clear(): void {
    this._user = null;
  }

  require(): AuthInfo {
    if (!this._user) {
      throw new Error(
        "Not authenticated. Use auth_login_email or auth_signup_email first."
      );
    }
    return {
      uid: this._user.uid,
      email: this._user.email,
      displayName: this._user.displayName,
      photoURL: this._user.photoURL,
    };
  }
}
