import { useQuery } from "@tanstack/react-query";
import { getBanks, type BankFilterParams } from "../api/banksApi";

export function useBanksQuery(filters: BankFilterParams) {
  return useQuery({
    queryFn: () => getBanks(filters),
    queryKey: ["banks", filters],
  });
}
