import { AuthSessionDto } from "../dtos/AuthSessionDto";

const authStorageKey = "zentry.auth";

function isExpired(expiresAt: string): boolean {
  return Date.now() >= Date.parse(expiresAt);
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
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(authStorageKey);
}
