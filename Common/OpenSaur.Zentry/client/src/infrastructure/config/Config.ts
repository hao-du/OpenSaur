import { ConfigDto } from "./dtos/ConfigDto";

declare global {
  interface Window {
    __ZENTRY_CONFIG__?: ConfigDto;
  }
}

export function getConfig(): ConfigDto {
  const runtimeConfig = window.__ZENTRY_CONFIG__;

  if (runtimeConfig == null) {
    throw new Error("window.__ZENTRY_CONFIG__ is missing.");
  }

  return runtimeConfig;
}
