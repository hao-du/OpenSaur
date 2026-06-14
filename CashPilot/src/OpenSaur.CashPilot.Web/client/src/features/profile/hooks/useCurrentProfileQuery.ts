import { useQuery } from "@tanstack/react-query";
import { getCurrentProfile } from "../api/profileApi";
import { loadCurrentProfile, saveCurrentProfile } from "../storages/currentProfileStore";

export function useCurrentProfileQuery() {
  return useQuery({
    queryFn: async () => {
      const cachedProfile = loadCurrentProfile();

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
