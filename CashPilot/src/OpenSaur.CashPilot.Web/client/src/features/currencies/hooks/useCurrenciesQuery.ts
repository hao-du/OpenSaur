import { useQuery } from "@tanstack/react-query";
import { getCurrencies, type CurrencyFilterParams } from "../api/currenciesApi";

export function useCurrenciesQuery(filters: CurrencyFilterParams) {
  return useQuery({
    queryFn: () => getCurrencies(filters),
    queryKey: ["currencies", filters]
  });
}
