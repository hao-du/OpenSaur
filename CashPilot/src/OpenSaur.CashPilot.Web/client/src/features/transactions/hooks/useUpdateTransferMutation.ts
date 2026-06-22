import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTransferForm } from "../api/transactionsApi";
import type { UpdateTransferFormRequestDto } from "../dtos/TransactionDto";
import { invalidateTransactionQueries } from "./mutationInvalidation";

export function useUpdateTransferMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTransferFormRequestDto;
    }) => updateTransferForm(id, payload),
    onSuccess: async () => {
      await invalidateTransactionQueries(queryClient);
    },
  });
}
