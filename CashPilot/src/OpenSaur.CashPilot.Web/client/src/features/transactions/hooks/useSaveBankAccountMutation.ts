import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveBankAccountForm } from "../api/transactionsApi";
import type { SaveBankAccountFormRequestDto } from "../dtos/TransactionDto";
import { invalidateTransactionQueries } from "./mutationInvalidation";

export function useSaveBankAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveBankAccountFormRequestDto) =>
      saveBankAccountForm(payload),
    onSuccess: async () => {
      await invalidateTransactionQueries(queryClient);
    },
  });
}
