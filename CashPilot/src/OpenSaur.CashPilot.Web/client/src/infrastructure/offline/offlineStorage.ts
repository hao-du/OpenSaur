const offlineStoragePrefix = "opensaur.cashpilot.offline";

function getStorageKey(key: string) {
  return `${offlineStoragePrefix}.${key}`;
}

export function loadOfflineJson<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(getStorageKey(key));
  if (rawValue == null) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

export function saveOfflineJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(key), JSON.stringify(value));
}

export function removeOfflineJson(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getStorageKey(key));
}
