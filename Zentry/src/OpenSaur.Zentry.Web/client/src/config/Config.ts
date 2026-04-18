import { RuntimeConfig } from "../dtos/config/ConfigDto";

declare global {
  interface Window {
    __ZENTRY_CONFIG__?: RuntimeConfig;
  }
}

export function getConfig(): RuntimeConfig {
  const runtimeConfig = window.__ZENTRY_CONFIG__;

  if (runtimeConfig == null) {
    throw new Error("window.__ZENTRY_CONFIG__ is missing.");
  }

  return runtimeConfig;
}
