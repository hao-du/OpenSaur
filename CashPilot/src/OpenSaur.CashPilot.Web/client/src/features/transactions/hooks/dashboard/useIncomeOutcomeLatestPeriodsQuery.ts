import { useQuery } from "@tanstack/react-query";
import { getIncomeOutcomeLatestPeriods } from "../../api/transactionsApi";

export function useIncomeOutcomeLatestPeriodsQuery(isMonthly: boolean, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => getIncomeOutcomeLatestPeriods(isMonthly),
    queryKey: ["income-outcome-latest-periods", isMonthly],
  });
}
