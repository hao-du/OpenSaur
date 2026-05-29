import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCounterparty } from "../api/counterpartiesApi";

export function useDeleteCounterpartyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCounterparty(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["counterparties"] });
    },
  });
}
