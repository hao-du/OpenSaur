import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCurrency } from "../api/currenciesApi";

export function useDeleteCurrencyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCurrency(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["currencies"] });
    },
  });
}
