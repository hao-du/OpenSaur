import { useQuery } from "@tanstack/react-query";
import { getIncomeOutcomeByRange } from "../services/reportsApi";

export function useIncomeOutcomeByRangeReportQuery(fromDate: string, toDate: string) {
  return useQuery({
    queryKey: ["reports", "income-outcome-by-range", fromDate, toDate],
    queryFn: () => getIncomeOutcomeByRange(fromDate, toDate),
    enabled: Boolean(fromDate && toDate && fromDate <= toDate),
  });
}
