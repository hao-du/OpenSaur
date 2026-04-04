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

function normalizePath(path: string) {
  const trimmedPath = path.trim();
  if (trimmedPath.length === 0 || trimmedPath === "/") {
    return "/";
  }

  const withoutTrailingSlash = trimmedPath.endsWith("/")
    ? trimmedPath.slice(0, -1)
    : trimmedPath;

  return withoutTrailingSlash.startsWith("/")
    ? withoutTrailingSlash
    : `/${withoutTrailingSlash}`;
}

function combinePath(basePath: string, segment: string) {
  const normalizedBasePath = normalizePath(basePath);
  const normalizedSegment = segment.replace(/^\/+/, "");

  return normalizedBasePath === "/"
    ? `/${normalizedSegment}`
    : `${normalizedBasePath}/${normalizedSegment}`;
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

  const issuerUrl = new URL(appEnvironment.firstPartyAuth.issuer);

  return window.location.origin === issuerUrl.origin
    && normalizePath(appEnvironment.basePath) === normalizePath(issuerUrl.pathname);
}

export function isFirstPartyAuthorizeReturnUrl(returnUrl: string) {
  if (!returnUrl.startsWith("/")) {
    return false;
  }

  try {
    const issuerUrl = new URL(appEnvironment.firstPartyAuth.issuer);
    const resolvedReturnUrl = new URL(returnUrl, issuerUrl.origin);

    return resolvedReturnUrl.pathname === combinePath(issuerUrl.pathname, "connect/authorize");
  } catch {
    return false;
  }
}

export function continueFirstPartyAuthorizationReturnUrl(returnUrl: string) {
  window.location.assign(returnUrl);
}

export function startFirstPartyAuthorization(authorizeUrl?: string) {
  const resolvedAuthorizeUrl = authorizeUrl ?? buildFirstPartyAuthorizeUrl({
    state: createFirstPartyAuthorizationState()
  });

  window.location.replace(resolvedAuthorizeUrl);
}
