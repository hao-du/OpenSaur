export type AppMode = "online" | "offline";

const defaultAppMode: AppMode = "online";

declare global {
  interface Window {
    __CASHPILOT_APP_MODE__?: AppMode;
  }
}

export function setAppMode(mode: AppMode) {
  window.__CASHPILOT_APP_MODE__ = mode;
}

export function getAppMode(): AppMode {
  return window.__CASHPILOT_APP_MODE__ ?? defaultAppMode;
}

export function isOfflineMode() {
  return getAppMode() === "offline";
}
