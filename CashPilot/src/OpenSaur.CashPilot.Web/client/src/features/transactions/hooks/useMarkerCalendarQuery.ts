import { useQuery } from "@tanstack/react-query";
import { getMarkerCalendar } from "../api/transactionsApi";

export function useMarkerCalendarQuery(tagName: string, periodIndex?: number, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getMarkerCalendar(tagName, periodIndex),
    queryKey: ["marker-calendar", tagName, periodIndex]
  });
}
