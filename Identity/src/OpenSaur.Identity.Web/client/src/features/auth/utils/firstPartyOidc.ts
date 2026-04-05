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
  const authorizeUri = new URL("connect/authorize", getIssuerBaseUri());
  authorizeUri.search = new URLSearchParams({
    client_id: appEnvironment.firstPartyAuth.clientId,
    redirect_uri: appEnvironment.firstPartyAuth.redirectUri,
    response_type: "code",
    scope: appEnvironment.firstPartyAuth.scope,
    state
  }).toString();

  return authorizeUri.toString();
}

export function isCurrentAppHostedByIssuer() {
  return appEnvironment.firstPartyAuth.isIssuerHostedApp;
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
