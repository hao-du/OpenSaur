import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveTransferForm } from "../api/transactionsApi";
import type { SaveTransferFormRequestDto } from "../dtos/TransactionDto";
import { invalidateTransactionQueries } from "./mutationInvalidation";

export function useSaveTransferMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveTransferFormRequestDto) =>
      saveTransferForm(payload),
    onSuccess: async () => {
      await invalidateTransactionQueries(queryClient);
    },
  });
}
