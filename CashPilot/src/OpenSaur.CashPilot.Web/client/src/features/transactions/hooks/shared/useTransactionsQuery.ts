import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "../../api/transactionsApi";

export function useTransactionsQuery(filter?: {
  description?: string;
  fromDate?: string;
  toDate?: string;
  showOnlyInitialDeposits?: boolean;
  types?: string[];
}) {
  return useQuery({
    queryFn: () => getTransactions(filter),
    queryKey: ["transactions", filter],
  });
}
