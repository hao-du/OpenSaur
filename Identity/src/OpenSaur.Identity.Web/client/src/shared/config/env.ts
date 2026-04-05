function resolveFirstPartyRedirectUri() {
  const fallbackRedirectUri = import.meta.env.VITE_FIRST_PARTY_OIDC_REDIRECT_URI
    ?? "https://app.duchihao.com/identity/auth/callback";

  if (typeof window === "undefined") {
    return fallbackRedirectUri;
  }

  return new URL("auth/callback", new URL(import.meta.env.BASE_URL ?? "/", window.location.origin)).toString();
}

export const appEnvironment = {
  appName: "OpenSaur Identity",
  basePath: import.meta.env.BASE_URL ?? "/",
  firstPartyAuth: {
    issuer: import.meta.env.VITE_FIRST_PARTY_OIDC_ISSUER ?? "https://app.duchihao.com/identity",
    clientId: import.meta.env.VITE_FIRST_PARTY_OIDC_CLIENT_ID ?? "first-party-web",
    redirectUri: resolveFirstPartyRedirectUri(),
    scope: import.meta.env.VITE_FIRST_PARTY_OIDC_SCOPE ?? "openid profile email roles offline_access api"
  }
};
