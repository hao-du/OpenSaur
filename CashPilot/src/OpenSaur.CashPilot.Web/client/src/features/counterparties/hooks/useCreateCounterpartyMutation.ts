import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCounterparty } from "../api/counterpartiesApi";
import type { CreateCounterpartyRequestDto } from "../dtos/CounterpartyDto";

export function useCreateCounterpartyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCounterpartyRequestDto) =>
      createCounterparty(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["counterparties"] });
    },
  });
}
