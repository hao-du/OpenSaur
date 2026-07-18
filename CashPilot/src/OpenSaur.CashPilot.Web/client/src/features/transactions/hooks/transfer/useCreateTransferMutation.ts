import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTransferForm } from "../../api/transactionsApi";
import type { CreateTransferFormRequestDto } from "../../dtos/TransactionDto";
import { invalidateTransactionQueries } from "../shared/mutationInvalidation";

export function useCreateTransferMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransferFormRequestDto) =>
      createTransferForm(payload),
    onSuccess: async () => {
      await invalidateTransactionQueries(queryClient);
    },
  });
}



