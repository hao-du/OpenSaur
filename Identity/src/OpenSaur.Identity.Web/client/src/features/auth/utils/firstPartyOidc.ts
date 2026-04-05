import { appEnvironment } from "../../../shared/config/env";
import { normalizeAuthReturnUrl } from "./normalizeAuthReturnUrl";

type BuildFirstPartyAuthorizeUrlOptions = {
  state: string;
};

type FirstPartyAuthorizationStatePayload = {
  nonce: string;
  returnUrl: string;
};

function createAuthorizationNonce() {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `auth-${Date.now()}`;
}

function trimTrailingSlash(path: string) {
  const trimmedPath = path.trim();
  if (trimmedPath.length === 0 || trimmedPath === "/") {
    return "/";
  }

  return trimmedPath.endsWith("/")
    ? trimmedPath.slice(0, -1)
    : trimmedPath;
}

function getIssuerBaseUri() {
  const issuer = appEnvironment.firstPartyAuth.issuer;
  return new URL(issuer.endsWith("/") ? issuer : `${issuer}/`);
}

function getIssuerAuthorizePath() {
  return new URL("connect/authorize", getIssuerBaseUri()).pathname;
}

function getIssuerImpersonationPaths() {
  const issuerBaseUri = getIssuerBaseUri();

  return new Set([
    new URL("api/auth/impersonation/start", issuerBaseUri).pathname,
    new URL("api/auth/impersonation/exit", issuerBaseUri).pathname
  ]);
}

function parseAuthorizationState(state: string | null | undefined) {
  if (!state) {
    return null;
  }

  try {
    const parsedState = JSON.parse(decodeURIComponent(state)) as Partial<FirstPartyAuthorizationStatePayload>;
    if (typeof parsedState.returnUrl !== "string") {
      return null;
    }

    return {
      nonce: typeof parsedState.nonce === "string"
        ? parsedState.nonce
        : "",
      returnUrl: normalizeAuthReturnUrl(parsedState.returnUrl)
    } satisfies FirstPartyAuthorizationStatePayload;
  } catch {
    return null;
  }
}

export function createFirstPartyAuthorizationState(returnUrl = "/") {
  return encodeURIComponent(JSON.stringify({
    nonce: createAuthorizationNonce(),
    returnUrl: normalizeAuthReturnUrl(returnUrl)
  } satisfies FirstPartyAuthorizationStatePayload));
}

export function readFirstPartyAuthorizationReturnUrl(state: string | null | undefined) {
  return parseAuthorizationState(state)?.returnUrl ?? null;
}

export function buildFirstPartyAuthorizeUrl({
  state
}: BuildFirstPartyAuthorizeUrlOptions) {
  const query = new URLSearchParams({
    client_id: appEnvironment.firstPartyAuth.clientId,
    redirect_uri: appEnvironment.firstPartyAuth.redirectUri,
    response_type: "code",
    scope: appEnvironment.firstPartyAuth.scope,
    state
  });

  return `${appEnvironment.firstPartyAuth.issuer}/connect/authorize?${query.toString()}`;
}

export function isCurrentAppHostedByIssuer() {
  if (typeof window === "undefined") {
    return false;
  }

  const issuerUrl = getIssuerBaseUri();
  const currentBasePath = new URL(appEnvironment.basePath, window.location.origin).pathname;

  return window.location.origin === issuerUrl.origin
    && trimTrailingSlash(currentBasePath) === trimTrailingSlash(issuerUrl.pathname);
}

export function isFirstPartyAuthorizeReturnUrl(returnUrl: string) {
  if (!returnUrl.startsWith("/")) {
    return false;
  }

  try {
    const resolvedReturnUrl = new URL(returnUrl, getIssuerBaseUri().origin);

    return resolvedReturnUrl.pathname === getIssuerAuthorizePath();
  } catch {
    return false;
  }
}

export function isIssuerAuthenticationContinuationReturnUrl(returnUrl: string) {
  if (!returnUrl.startsWith("/")) {
    return false;
  }

  try {
    const resolvedReturnUrl = new URL(returnUrl, getIssuerBaseUri().origin);

    return resolvedReturnUrl.pathname === getIssuerAuthorizePath()
      || getIssuerImpersonationPaths().has(resolvedReturnUrl.pathname);
  } catch {
    return false;
  }
}

export function startFirstPartyAuthorization(authorizeUrl?: string) {
  const resolvedAuthorizeUrl = authorizeUrl ?? buildFirstPartyAuthorizeUrl({
    state: createFirstPartyAuthorizationState()
  });

  window.location.replace(resolvedAuthorizeUrl);
}
