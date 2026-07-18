import { useQuery } from "@tanstack/react-query";
import { getTransactionsByPeriod } from "../../api/transactionsApi";

export function useTransactionsByPeriodQuery(startDate?: string | null, endDate?: string | null, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getTransactionsByPeriod(startDate, endDate),
    queryKey: ["transactions-by-period", startDate ?? null, endDate ?? null],
  });
}
