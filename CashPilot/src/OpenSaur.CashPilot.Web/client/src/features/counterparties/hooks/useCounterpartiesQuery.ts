import { useQuery } from "@tanstack/react-query";
import {
  getCounterparties,
  type CounterpartyFilterParams,
} from "../api/counterpartiesApi";

export function useCounterpartiesQuery(filters: CounterpartyFilterParams) {
  return useQuery({
    queryFn: () => getCounterparties(filters),
    queryKey: ["counterparties", filters],
  });
}
