import { useQuery } from "@tanstack/react-query";
import { getCurrentProfile } from "../api/profileApi";
import { loadCurrentProfile, saveCurrentProfile } from "../storages/currentProfileStore";
import { useNetworkStatus } from "../../../infrastructure/offline/useNetworkStatus";

export function useCurrentProfileQuery() {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryFn: async () => {
      const cachedProfile = loadCurrentProfile();

      if (isOnline !== true && cachedProfile != null) {
        return cachedProfile;
      }

      try {
        const profile = await getCurrentProfile();
        saveCurrentProfile(profile);
        return profile;
      } catch {
        if (cachedProfile != null) {
          return cachedProfile;
        }

        throw new Error("Profile is unavailable.");
      }
    },
    queryKey: ["profile", "current"],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity
  });
}
