import { useQuery } from "@tanstack/react-query";
import { getCurrentProfile } from "../api/profileApi";

export function useCurrentProfileQuery() {
  return useQuery({
    queryFn: getCurrentProfile,
    queryKey: ["profile", "current"],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity
  });
}
