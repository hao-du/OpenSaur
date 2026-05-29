import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCashFlow } from "../api/transactionsApi";
import type { CreateCashFlowRequestDto } from "../dtos/TransactionDto";
import { invalidateTransactionQueries } from "./mutationInvalidation";

export function useCreateCashFlowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCashFlowRequestDto) => createCashFlow(payload),
    onSuccess: async () => {
      await invalidateTransactionQueries(queryClient);
    },
  });
}
