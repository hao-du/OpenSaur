window.__CASHPILOT_CONFIG__ = Object.freeze({
  appName: "CashPilot",
  apiBaseUrl:
    window.location.hostname.startsWith("off.") ||
    window.location.hostname.includes(".web.core.windows.net")
      ? "https://cashpilot.duchihao.com"
      : window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "https://localhost:5031"
        : window.location.origin,
  authority: "https://coregate.duchihao.com",
  basePath: "/",
  clientId: "cashpilot",
  postLogoutRedirectUri: `${window.location.origin}/`,
  redirectUri: `${window.location.origin}/auth/callback`,
  scope: "openid profile email roles offline_access api"
});
