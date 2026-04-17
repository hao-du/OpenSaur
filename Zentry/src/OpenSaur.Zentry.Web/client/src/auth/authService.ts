import { exchangeAuthorizationCode } from "../api/oidcApi";
import { fetchUserInfo } from "../api/userInfo";
import {
  clearAuthSession,
  clearPendingAuthRequest,
  readAuthSession,
  readPendingAuthRequest,
  saveAuthSession,
  savePendingAuthRequest
} from "./authStorage";
import { buildPkceRequest } from "./pkce";
import {
  buildAuthorizationUrl,
  buildEndSessionUrl
} from "./oidcClient";
import type { AppRuntimeConfig, AuthSession, TokenSet, UserProfile } from "./authTypes";

export function readStoredAuthSession() {
  return readAuthSession();
}

export async function beginLogin(config: AppRuntimeConfig, redirectPath = "/dashboard") {
  const request = await buildPkceRequest(redirectPath);
  savePendingAuthRequest(request);
  return buildAuthorizationUrl(config, request);
}

export async function completeLogin(config: AppRuntimeConfig, callbackUrl: string) {
  const url = new URL(callbackUrl);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    throw new Error("Authorization code is missing from the callback.");
  }

  if (!state) {
    throw new Error("OIDC state is missing from the callback.");
  }

  const pendingRequest = readPendingAuthRequest();
  if (!pendingRequest || pendingRequest.state !== state) {
    clearPendingAuthRequest();
    throw new Error("OIDC state validation failed.");
  }

  let payload: Record<string, unknown>;

  try {
    payload = await exchangeAuthorizationCode(config, code, pendingRequest);
  } catch (error) {
    clearPendingAuthRequest();
    clearAuthSession();
    throw error;
  }

  const tokenSet = buildTokenSet(payload);
  validateIdTokenNonce(tokenSet.idToken, pendingRequest.nonce);

  let profile: UserProfile | null = null;
  try {
    profile = await fetchUserInfo(config, tokenSet.accessToken);
  } catch (error) {
    clearPendingAuthRequest();
    clearAuthSession();
    throw error;
  }

  if (!profile) {
    clearPendingAuthRequest();
    clearAuthSession();
    throw new Error("User info request failed after login.");
  }

  clearPendingAuthRequest();
  const session: AuthSession = {
    profile,
    tokenSet
  };
  saveAuthSession(session);
  return session;
}

export function buildLogoutRedirect(config: AppRuntimeConfig, session: AuthSession | null) {
  clearPendingAuthRequest();
  clearAuthSession();
  return buildEndSessionUrl(config, session?.tokenSet.idToken);
}

function buildTokenSet(payload: Record<string, unknown>): TokenSet {
  const accessToken = readRequiredString(payload.access_token, "access_token");
  const tokenType = readString(payload.token_type) ?? "Bearer";
  const scope = readString(payload.scope);
  const idToken = readString(payload.id_token);
  const expiresInSeconds = readNumber(payload.expires_in) ?? 300;

  return {
    accessToken,
    expiresAtUtc: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    idToken,
    scope,
    tokenType
  };
}

function validateIdTokenNonce(idToken: string | undefined, expectedNonce: string) {
  if (!idToken) {
    return;
  }

  const payload = readJwtPayload(idToken);
  if (!payload) {
    throw new Error("ID token payload could not be decoded.");
  }

  const nonce = readString(payload.nonce);
  if (!nonce || nonce !== expectedNonce) {
    throw new Error("OIDC nonce validation failed.");
  }
}

function readJwtPayload(token: string): Record<string, unknown> | null {
  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }

  try {
    const normalizedPayload = segments[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(segments[1].length / 4) * 4, "=");

    const decoded = atob(normalizedPayload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readRequiredString(value: unknown, fieldName: string) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  throw new Error(`Token response is missing '${fieldName}'.`);
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0
    ? value
    : undefined;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

