import { useQuery } from "@tanstack/react-query";
import { getSettings } from "../api/settingsApi";

export function useSettingsQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: getSettings,
    queryKey: ["settings"]
  });
}
