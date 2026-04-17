import type { AppRuntimeConfig, PendingAuthRequest } from "./authTypes";

export function buildAuthorizationUrl(config: AppRuntimeConfig, request: PendingAuthRequest) {
  const url = new URL("connect/authorize", ensureAuthorityBase(config.authority));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("code_challenge", request.codeChallenge);
  url.searchParams.set("code_challenge_method", request.codeChallengeMethod);
  url.searchParams.set("state", request.state);

  return url.toString();
}

export function buildTokenEndpointUrl(config: AppRuntimeConfig) {
  return new URL("connect/token", ensureAuthorityBase(config.authority)).toString();
}

export function buildUserInfoEndpointUrl(config: AppRuntimeConfig) {
  return new URL("connect/userinfo", ensureAuthorityBase(config.authority)).toString();
}

export function buildEndSessionUrl(config: AppRuntimeConfig, idTokenHint?: string) {
  const url = new URL("connect/endsession", ensureAuthorityBase(config.authority));
  url.searchParams.set("post_logout_redirect_uri", config.postLogoutRedirectUri);

  if (idTokenHint) {
    url.searchParams.set("id_token_hint", idTokenHint);
  }

  return url.toString();
}

export function buildTokenRequestBody(
  config: AppRuntimeConfig,
  code: string,
  request: PendingAuthRequest)
{
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("client_id", config.clientId);
  body.set("redirect_uri", config.redirectUri);
  body.set("code", code);
  body.set("code_verifier", request.codeVerifier);

  return body;
}

function ensureAuthorityBase(authority: string) {
  return authority.endsWith("/")
    ? authority
    : `${authority}/`;
}
