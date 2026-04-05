export type AuthSessionSnapshot = {
  accessToken: string | null;
  expiresAt: string | null;
  status: "anonymous" | "authenticated";
};

type AuthenticatedSession = {
  accessToken: string;
  expiresAt: string;
};

const returnUrlStorageKey = "opensaur.identity.return-url";
export const sessionSyncStorageKey = "opensaur.identity.session-sync";

let snapshot: AuthSessionSnapshot = {
  accessToken: null,
  expiresAt: null,
  status: "anonymous"
};

const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function broadcastSessionChange(kind: "clear" | "refresh") {
  const storage = getLocalStorage();
  if (!storage || typeof storage.setItem !== "function") {
    return;
  }

  storage.setItem(sessionSyncStorageKey, JSON.stringify({
    kind,
    timestamp: Date.now()
  }));
}

export const authSessionStore = {
  clearSession() {
    snapshot = {
      accessToken: null,
      expiresAt: null,
      status: "anonymous"
    };

    notifyListeners();
  },

  consumeReturnUrl() {
    const storage = getSessionStorage();
    const returnUrl = storage?.getItem(returnUrlStorageKey) ?? null;

    storage?.removeItem(returnUrlStorageKey);

    return returnUrl;
  },

  clearRememberedReturnUrl() {
    getSessionStorage()?.removeItem(returnUrlStorageKey);
  },

  getAccessToken() {
    return snapshot.accessToken;
  },

  getRememberedReturnUrl() {
    return getSessionStorage()?.getItem(returnUrlStorageKey) ?? null;
  },

  getSnapshot() {
    return snapshot;
  },

  rememberReturnUrl(returnUrl: string) {
    getSessionStorage()?.setItem(returnUrlStorageKey, returnUrl);
  },

  broadcastSessionCleared() {
    broadcastSessionChange("clear");
  },

  broadcastSessionRefresh() {
    broadcastSessionChange("refresh");
  },

  setCookieAuthenticatedSession() {
    snapshot = {
      accessToken: null,
      expiresAt: null,
      status: "authenticated"
    };

    notifyListeners();
  },

  setAuthenticatedSession(session: AuthenticatedSession) {
    snapshot = {
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
      status: "authenticated"
    };

    notifyListeners();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }
};
