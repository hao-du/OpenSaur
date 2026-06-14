const defaultAppMode = "online";

export const isOfflineBuild = (import.meta.env.VITE_CASHPILOT_APP_MODE ?? defaultAppMode) === "offline";
