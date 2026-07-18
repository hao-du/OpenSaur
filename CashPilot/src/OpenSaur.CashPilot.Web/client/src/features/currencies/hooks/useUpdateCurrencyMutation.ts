import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCurrency } from "../api/currenciesApi";
import type { UpsertCurrencyRequestDto } from "../dtos/CurrencyDto";

export function useUpdateCurrencyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpsertCurrencyRequestDto;
    }) => updateCurrency(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["currencies"] });
    },
  });
}
