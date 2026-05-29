import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBank } from "../api/banksApi";
import type { UpsertBankRequestDto } from "../dtos/BankDto";

export function useCreateBankMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertBankRequestDto) => createBank(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
}
