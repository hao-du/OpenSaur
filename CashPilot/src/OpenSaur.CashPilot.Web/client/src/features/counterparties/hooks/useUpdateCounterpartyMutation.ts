import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCounterparty } from "../api/counterpartiesApi";
import type { UpdateCounterpartyRequestDto } from "../dtos/CounterpartyDto";

export function useUpdateCounterpartyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCounterpartyRequestDto;
    }) => updateCounterparty(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["counterparties"] });
    },
  });
}
