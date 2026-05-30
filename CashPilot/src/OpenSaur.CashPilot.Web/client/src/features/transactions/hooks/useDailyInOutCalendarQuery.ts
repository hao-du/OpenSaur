import { useQuery } from "@tanstack/react-query";
import { getDailyInOutCalendar } from "../api/transactionsApi";

export function useDailyInOutCalendarQuery(year: number, month: number) {
  return useQuery({
    queryFn: () => getDailyInOutCalendar(year, month),
    queryKey: ["transaction-daily-in-out", year, month]
  });
}
