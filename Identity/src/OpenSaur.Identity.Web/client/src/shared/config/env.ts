type OpenSaurIdentityRuntimeConfig = {
  appName: string;
  basePath: string;
  firstPartyAuth: {
    issuer: string;
    clientId: string;
    redirectUri: string;
    scope: string;
    isIssuerHostedApp: boolean;
  };
  googleRecaptchaV3: {
    enabled: boolean;
    siteKey: string;
    loginAction: string;
  };
};

declare global {
  interface Window {
    __OPENSAUR_IDENTITY_CONFIG__?: OpenSaurIdentityRuntimeConfig;
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

function getRuntimeConfig(): OpenSaurIdentityRuntimeConfig {
  if (typeof window === "undefined") {
    return {
      appName: "OpenSaur Identity",
      basePath: "/identity",
      firstPartyAuth: {
        issuer: "http://localhost/identity",
        clientId: "first-party-web",
        redirectUri: "http://localhost/identity/auth/callback",
        scope: "openid profile email roles offline_access api",
        isIssuerHostedApp: false
      },
      googleRecaptchaV3: {
        enabled: false,
        siteKey: "",
        loginAction: "login"
      }
    };
  }

  const runtimeConfig = window.__OPENSAUR_IDENTITY_CONFIG__;
  if (!runtimeConfig) {
    throw new Error("OpenSaur Identity runtime configuration is missing.");
  }

  return runtimeConfig;
}

const runtimeConfig = getRuntimeConfig();

export const appEnvironment = {
  appName: runtimeConfig.appName,
  basePath: normalizeBasePath(runtimeConfig.basePath),
  firstPartyAuth: {
    issuer: runtimeConfig.firstPartyAuth.issuer,
    clientId: runtimeConfig.firstPartyAuth.clientId,
    redirectUri: runtimeConfig.firstPartyAuth.redirectUri,
    scope: runtimeConfig.firstPartyAuth.scope,
    isIssuerHostedApp: runtimeConfig.firstPartyAuth.isIssuerHostedApp
  },
  googleRecaptchaV3: {
    enabled: runtimeConfig.googleRecaptchaV3.enabled,
    siteKey: runtimeConfig.googleRecaptchaV3.siteKey,
    loginAction: runtimeConfig.googleRecaptchaV3.loginAction
  }
};
