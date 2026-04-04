import { appEnvironment } from "../../../shared/config/env";

type BuildFirstPartyAuthorizeUrlOptions = {
  state: string;
};

export function createFirstPartyAuthorizationState() {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `auth-${Date.now()}`;
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

export function startFirstPartyAuthorization(authorizeUrl?: string) {
  const resolvedAuthorizeUrl = authorizeUrl ?? buildFirstPartyAuthorizeUrl({
    state: createFirstPartyAuthorizationState()
  });

  window.location.replace(resolvedAuthorizeUrl);
}
