import { useQuery } from "@tanstack/react-query";
import { getPendingTransactions } from "../api/pendingTransactionsApi";

export function usePendingTransactionsQuery() {
  return useQuery({
    queryFn: async () => getPendingTransactions(),
    queryKey: ["pending-transactions"],
  });
}
