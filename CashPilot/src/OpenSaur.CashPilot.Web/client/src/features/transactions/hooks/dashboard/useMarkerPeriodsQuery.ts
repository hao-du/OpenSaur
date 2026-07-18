import { useQuery } from "@tanstack/react-query";
import { getMarkerPeriods } from "../../api/transactionsApi";

export function useMarkerPeriodsQuery(makerId: string, enabled = true) {
  return useQuery({
    enabled: enabled && makerId.trim().length > 0,
    queryFn: () => getMarkerPeriods(makerId),
    queryKey: ["marker-periods", makerId],
  });
}
