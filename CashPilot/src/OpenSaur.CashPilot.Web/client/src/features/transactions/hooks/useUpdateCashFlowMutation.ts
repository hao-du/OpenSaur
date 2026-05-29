import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCashFlow } from "../api/transactionsApi";
import type { CreateCashFlowRequestDto } from "../dtos/TransactionDto";
import { invalidateTransactionQueries } from "./mutationInvalidation";

export function useUpdateCashFlowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CreateCashFlowRequestDto & { isActive: boolean };
    }) => updateCashFlow(id, payload),
    onSuccess: async () => {
      await invalidateTransactionQueries(queryClient);
    },
  });
}
