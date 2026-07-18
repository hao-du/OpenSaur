import { useMutation } from "@tanstack/react-query";
import { autoTagTransaction } from "../../api/transactionsApi";
import type { AutoTagRequestDto } from "../../dtos/TransactionDto";

export function useAutoTagMutation() {
  return useMutation({
    mutationFn: (payload: AutoTagRequestDto) => autoTagTransaction(payload),
  });
}

