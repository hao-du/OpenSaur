import type { AppRuntimeConfig } from "../auth/authTypes";

declare global {
  interface Window {
    __OPENSAUR_ZENTRY_CONFIG__?: AppRuntimeConfig;
  }
}

function normalizeBasePath(basePath: string) {
  const trimmedBasePath = basePath.trim();
  if (trimmedBasePath.length === 0 || trimmedBasePath === "/") {
    return "/";
  }

  const withoutTrailingSlash = trimmedBasePath.endsWith("/")
    ? trimmedBasePath.slice(0, -1)
    : trimmedBasePath;

  return withoutTrailingSlash.startsWith("/")
    ? withoutTrailingSlash
    : `/${withoutTrailingSlash}`;
}

function getRuntimeConfig(): AppRuntimeConfig {
  if (typeof window === "undefined") {
    return {
      appName: "OpenSaur Zentry",
      authority: "https://localhost:5001",
      basePath: "/",
      clientId: "zentry-spa",
      postLogoutRedirectUri: "https://localhost:5011/",
      redirectUri: "https://localhost:5011/auth/callback",
      scope: "openid profile email roles offline_access"
    };
  }

  const runtimeConfig = window.__OPENSAUR_ZENTRY_CONFIG__;
  if (!runtimeConfig) {
    throw new Error("OpenSaur Zentry runtime configuration is missing.");
  }

  return runtimeConfig;
}

const runtimeConfig = getRuntimeConfig();

export const appEnvironment: AppRuntimeConfig = {
  ...runtimeConfig,
  basePath: normalizeBasePath(runtimeConfig.basePath)
};
