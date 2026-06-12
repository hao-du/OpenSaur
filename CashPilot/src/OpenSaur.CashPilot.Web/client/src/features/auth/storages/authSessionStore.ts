import type { AuthSessionDto } from "../dtos/AuthSessionDto";
import { loadOfflineJson, removeOfflineJson, saveOfflineJson } from "../../../infrastructure/offline/offlineStorage";

const authSessionKey = "auth.session";

export function loadAuthSession() {
  return loadOfflineJson<AuthSessionDto>(authSessionKey);
}

export function saveAuthSession(authSession: AuthSessionDto) {
  saveOfflineJson(authSessionKey, authSession);
}

export function clearAuthSession() {
  removeOfflineJson(authSessionKey);
}
