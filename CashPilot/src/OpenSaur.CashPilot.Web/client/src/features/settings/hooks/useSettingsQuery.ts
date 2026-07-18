import { useQuery } from "@tanstack/react-query";
import { getSettings } from "../api/settingsApi";
import { loadCachedSettings, saveCachedSettings } from "../storages/settingsStore";
import { useNetworkStatus } from "../../../infrastructure/offline/useNetworkStatus";

export function useSettingsQuery(enabled = true) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    enabled,
    queryFn: async () => {
      const cachedSettings = loadCachedSettings();

      if (isOnline !== true && cachedSettings != null) {
        return cachedSettings;
      }

      try {
        const settings = await getSettings();
        saveCachedSettings(settings);
        return settings;
      } catch {
        if (cachedSettings != null) {
          return cachedSettings;
        }

        throw new Error("Settings are unavailable.");
      }
    },
    queryKey: ["settings"]
  });
}
