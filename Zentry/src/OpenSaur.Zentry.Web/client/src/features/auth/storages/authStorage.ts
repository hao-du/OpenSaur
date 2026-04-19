import { AuthSessionDto } from "../dtos/AuthSessionDto";

const authStorageKey = "zentry.auth";
const authStorageChangedEventName = "zentry:auth-storage-changed";

function isExpired(expiresAt: string): boolean {
  return Date.now() >= Date.parse(expiresAt);
}

function dispatchAuthStorageChanged() {
  window.dispatchEvent(new Event(authStorageChangedEventName));
}

export function getAuthSession(): AuthSessionDto | null {
  const rawValue = sessionStorage.getItem(authStorageKey);
  if (rawValue == null) {
    return null;
  }

  const authSession = JSON.parse(rawValue) as AuthSessionDto;
  if (isExpired(authSession.expiresAt)) {
    clearAuthSession();
    return null;
  }

  return authSession;
}

export function saveAuthSession(authSession: AuthSessionDto): void {
  sessionStorage.setItem(authStorageKey, JSON.stringify(authSession));
  dispatchAuthStorageChanged();
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(authStorageKey);
  dispatchAuthStorageChanged();
}

export function subscribeAuthStorageChanged(onChanged: () => void): () => void {
  window.addEventListener(authStorageChangedEventName, onChanged);

  return () => {
    window.removeEventListener(authStorageChangedEventName, onChanged);
  };
}
