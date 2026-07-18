import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBankAccountForm } from "../../api/transactionsApi";
import type { CreateBankAccountFormRequestDto } from "../../dtos/TransactionDto";
import { invalidateTransactionQueries } from "../shared/mutationInvalidation";

export function useCreateBankAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBankAccountFormRequestDto) =>
      createBankAccountForm(payload),
    onSuccess: async () => {
      await invalidateTransactionQueries(queryClient);
    },
  });
}



