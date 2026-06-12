import type { CurrentProfileDto } from "../dtos/CurrentProfileDto";
import { loadOfflineJson, removeOfflineJson, saveOfflineJson } from "../../../infrastructure/offline/offlineStorage";

const currentProfileKey = "profile.current";

export function loadCurrentProfile() {
  return loadOfflineJson<CurrentProfileDto>(currentProfileKey);
}

export function saveCurrentProfile(profile: CurrentProfileDto) {
  saveOfflineJson(currentProfileKey, profile);
}

export function clearCurrentProfile() {
  removeOfflineJson(currentProfileKey);
}
