import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBank } from "../api/banksApi";

export function useDeleteBankMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBank(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
}
