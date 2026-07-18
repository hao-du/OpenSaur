import { useQuery } from "@tanstack/react-query";
import { getBankAccountFormById } from "../../api/transactionsApi";
import type { SaveBankAccountFormRequestDto } from "../../dtos/TransactionDto";

export function useBankAccountByIdQuery(
  id: string | null,
  enabled = true,
) {
  return useQuery<SaveBankAccountFormRequestDto>({
    enabled: enabled && id != null && id.length > 0,
    queryFn: () => getBankAccountFormById(id ?? ""),
    queryKey: ["transaction-bank-account", id],
  });
}
