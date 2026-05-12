import { useQuery } from "@tanstack/react-query";
import { getBankAccounts } from "../api/transactionsApi";

export function useBankAccountsQuery() {
  return useQuery({
    queryFn: getBankAccounts,
    queryKey: ["bankaccounts"]
  });
}
