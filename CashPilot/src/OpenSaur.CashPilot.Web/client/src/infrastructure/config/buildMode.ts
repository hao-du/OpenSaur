export type AppMode = "online" | "offline";

export function getAppMode(): AppMode {
  if (import.meta.env.MODE === "dev-offline" || import.meta.env.MODE === "offline") {
    return "offline";
  }

  if (typeof window === "undefined") {
    return "online";
  }

  return window.location.hostname.startsWith("off.") ? "offline" : "online";
}

export function isOfflineMode() {
  return getAppMode() === "offline";
}
