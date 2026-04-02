import { appEnvironment } from "../../../shared/config/env";
import { appBasePath, withAppBasePath } from "../../../shared/config/appBasePath";

type BuildFirstPartyAuthorizeUrlOptions = {
  origin?: string;
  state: string;
};

function buildRedirectUri(origin: string) {
  return `${origin}${withAppBasePath("/auth/callback")}`;
}

function createAuthorizationState() {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `auth-${Date.now()}`;
}

export function buildFirstPartyAuthorizeUrl({
  origin,
  state
}: BuildFirstPartyAuthorizeUrlOptions) {
  const resolvedOrigin =
    origin
    ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173");

  const query = new URLSearchParams({
    client_id: appEnvironment.firstPartyAuth.clientId,
    redirect_uri: buildRedirectUri(resolvedOrigin),
    response_type: "code",
    scope: appEnvironment.firstPartyAuth.scope,
    state
  });

  return `${appBasePath}/connect/authorize?${query.toString()}`;
}

export function startFirstPartyAuthorization() {
  const authorizeUrl = buildFirstPartyAuthorizeUrl({
    state: createAuthorizationState()
  });

  window.location.assign(authorizeUrl);
}
