import { useQuery } from "@tanstack/react-query";
import { getCurrencyBalances } from "../../api/transactionsApi";

export function useCurrencyBalancesQuery() {
  return useQuery({
    queryFn: getCurrencyBalances,
    queryKey: ["currency-balances"],
  });
}
