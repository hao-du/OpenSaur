export const appEnvironment = {
  appName: "OpenSaur Identity",
  basePath: import.meta.env.BASE_URL ?? "/",
  firstPartyAuth: {
    issuer: import.meta.env.VITE_FIRST_PARTY_OIDC_ISSUER ?? "https://app.duchihao.com/identity",
    clientId: import.meta.env.VITE_FIRST_PARTY_OIDC_CLIENT_ID ?? "first-party-web",
    redirectUri: import.meta.env.VITE_FIRST_PARTY_OIDC_REDIRECT_URI ?? "https://app.duchihao.com/identity/auth/callback",
    scope: import.meta.env.VITE_FIRST_PARTY_OIDC_SCOPE ?? "openid profile email roles offline_access api"
  }
};
