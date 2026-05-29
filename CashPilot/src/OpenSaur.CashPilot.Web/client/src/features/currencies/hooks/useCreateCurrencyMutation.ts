import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCurrency } from "../api/currenciesApi";
import type { UpsertCurrencyRequestDto } from "../dtos/CurrencyDto";

export function useCreateCurrencyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertCurrencyRequestDto) => createCurrency(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["currencies"] });
    },
  });
}
