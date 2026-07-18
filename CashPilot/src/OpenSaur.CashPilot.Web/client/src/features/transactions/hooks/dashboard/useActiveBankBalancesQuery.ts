import { useQuery } from "@tanstack/react-query";
import { getActiveBankBalances } from "../../api/transactionsApi";

export function useActiveBankBalancesQuery() {
  return useQuery({
    queryFn: getActiveBankBalances,
    queryKey: ["active-bank-balances"],
  });
}
