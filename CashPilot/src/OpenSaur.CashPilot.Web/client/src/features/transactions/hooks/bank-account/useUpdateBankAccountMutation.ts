import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBankAccountForm } from "../../api/transactionsApi";
import type { UpdateBankAccountFormRequestDto } from "../../dtos/TransactionDto";
import { invalidateTransactionQueries } from "../shared/mutationInvalidation";

export function useUpdateBankAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBankAccountFormRequestDto;
    }) => updateBankAccountForm(id, payload),
    onSuccess: async () => {
      await invalidateTransactionQueries(queryClient);
    },
  });
}



