import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBank } from "../api/banksApi";
import type { UpsertBankRequestDto } from "../dtos/BankDto";

export function useUpdateBankMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpsertBankRequestDto;
    }) => updateBank(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
}
