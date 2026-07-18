import { useQuery } from "@tanstack/react-query";
import { getIncomeOutcome } from "../services/reportsApi";

export function useIncomeOutcomeReportQuery(year: number, tagName?: string) {
  return useQuery({
    queryKey: ["reports", "income-outcome", year, tagName],
    queryFn: () => getIncomeOutcome(year, tagName),
    enabled: year > 0,
  });
}
