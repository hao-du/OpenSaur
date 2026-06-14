import { useQuery } from "@tanstack/react-query";
import { getSettings } from "../api/settingsApi";
import { loadCachedSettings, saveCachedSettings } from "../storages/settingsStore";

export function useSettingsQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: async () => {
      const cachedSettings = loadCachedSettings();

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
