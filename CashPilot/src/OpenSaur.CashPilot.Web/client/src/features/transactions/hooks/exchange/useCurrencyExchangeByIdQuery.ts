import { useQuery } from "@tanstack/react-query";
import { getCurrencyExchangeById } from "../../api/transactionsApi";
import type { CurrencyExchangeDetailDto } from "../../dtos/TransactionDto";

export function useCurrencyExchangeByIdQuery(
  id: string | null,
  enabled = true,
) {
  return useQuery<CurrencyExchangeDetailDto>({
    enabled: enabled && id != null && id.length > 0,
    queryFn: () => getCurrencyExchangeById(id ?? ""),
    queryKey: ["transaction-currency-exchange", id],
  });
}
