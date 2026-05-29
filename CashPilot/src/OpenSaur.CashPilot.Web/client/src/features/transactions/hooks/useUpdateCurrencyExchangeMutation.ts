import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCurrencyExchange } from "../api/transactionsApi";
import type { UpdateCurrencyExchangeRequestDto } from "../dtos/TransactionDto";
import { invalidateTransactionQueries } from "./mutationInvalidation";

export function useUpdateCurrencyExchangeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCurrencyExchangeRequestDto;
    }) => updateCurrencyExchange(id, payload),
    onSuccess: async () => {
      await invalidateTransactionQueries(queryClient);
    },
  });
}
