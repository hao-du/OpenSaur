import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTransactionByType } from "../api/transactionsApi";
import type { TransactionListItemDto } from "../dtos/TransactionDto";
import { invalidateTransactionQueries } from "./mutationInvalidation";

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      type,
    }: {
      id: string;
      type: TransactionListItemDto["type"];
    }) => deleteTransactionByType(type, id),
    onSuccess: async () => {
      await invalidateTransactionQueries(queryClient);
    },
  });
}
