import { useCallback } from "react";
import { getCurrentUserSettings } from "../../auth/api/authApi";
import { usePreferences } from "../PreferenceProvider";

export function useSyncAuthenticatedPreferences() {
  const { applyServerSettings } = usePreferences();

  return useCallback(async () => {
    try {
      const settings = await getCurrentUserSettings();
      applyServerSettings(settings);
      return settings;
    } catch {
      return null;
    }
  }, [applyServerSettings]);
}
