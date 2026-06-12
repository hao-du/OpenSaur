import type { SettingsDto } from "../dtos/SettingsDto";
import { loadOfflineJson, saveOfflineJson } from "../../../infrastructure/offline/offlineStorage";

const settingsCacheKey = "settings.current";

export function loadCachedSettings() {
  return loadOfflineJson<SettingsDto>(settingsCacheKey);
}

export function saveCachedSettings(settings: SettingsDto) {
  saveOfflineJson(settingsCacheKey, settings);
}
