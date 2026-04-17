import type { AuthSession, PendingAuthRequest } from "./authTypes";

const AuthStorageKey = "opensaur.zentry.auth";
const PendingAuthRequestStorageKey = "opensaur.zentry.pending-auth";

export function readAuthSession(now = new Date()): AuthSession | null {
  const session = readJson<AuthSession>(window.localStorage, AuthStorageKey);
  if (!session) {
    return null;
  }

  if (Date.parse(session.tokenSet.expiresAtUtc) <= now.getTime()) {
    clearAuthSession();
    return null;
  }

  return session;
}

export function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem(AuthStorageKey, JSON.stringify(session));
}

export function clearAuthSession() {
  window.localStorage.removeItem(AuthStorageKey);
}

export function readPendingAuthRequest(): PendingAuthRequest | null {
  return readJson<PendingAuthRequest>(window.sessionStorage, PendingAuthRequestStorageKey);
}

export function savePendingAuthRequest(request: PendingAuthRequest) {
  window.sessionStorage.setItem(PendingAuthRequestStorageKey, JSON.stringify(request));
}

export function clearPendingAuthRequest() {
  window.sessionStorage.removeItem(PendingAuthRequestStorageKey);
}

function readJson<T>(storage: Storage, key: string): T | null {
  const value = storage.getItem(key);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    storage.removeItem(key);
    return null;
  }
}
