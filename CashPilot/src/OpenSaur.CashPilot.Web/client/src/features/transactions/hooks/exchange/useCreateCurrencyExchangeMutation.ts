import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCurrencyExchange } from "../../api/transactionsApi";
import type { CreateCurrencyExchangeRequestDto } from "../../dtos/TransactionDto";
import { invalidateTransactionQueries } from "../shared/mutationInvalidation";

export function useCreateCurrencyExchangeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCurrencyExchangeRequestDto) =>
      createCurrencyExchange(payload),
    onSuccess: async () => {
      await invalidateTransactionQueries(queryClient);
    },
  });
}



