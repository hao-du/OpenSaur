import type { ConfigDto } from "./dtos/ConfigDto";

declare global {
  interface Window {
    __CASHPILOT_CONFIG__?: ConfigDto;
  }
}

export function getConfig(): ConfigDto {
  const runtimeConfig = window.__CASHPILOT_CONFIG__;

  if (runtimeConfig == null) {
    throw new Error("window.__CASHPILOT_CONFIG__ is missing.");
  }

  return runtimeConfig;
}

