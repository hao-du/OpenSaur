import { useQuery } from "@tanstack/react-query";
import { getTransactionDashboard } from "../api/transactionsApi";

export function useTransactionDashboardQuery() {
  return useQuery({
    queryFn: getTransactionDashboard,
    queryKey: ["transaction-dashboard"],
  });
}
