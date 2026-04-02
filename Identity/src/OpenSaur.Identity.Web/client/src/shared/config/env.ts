export const appEnvironment = {
  appName: "OpenSaur Identity",
  basePath: import.meta.env.BASE_URL ?? "/",
  firstPartyAuth: {
    clientId: import.meta.env.VITE_FIRST_PARTY_OIDC_CLIENT_ID ?? "first-party-web",
    scope: import.meta.env.VITE_FIRST_PARTY_OIDC_SCOPE ?? "openid profile email roles offline_access api"
  }
};
