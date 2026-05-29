import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "../api/transactionsApi";

export function useTransactionsQuery() {
  return useQuery({
    queryFn: getTransactions,
    queryKey: ["transactions"],
  });
}
