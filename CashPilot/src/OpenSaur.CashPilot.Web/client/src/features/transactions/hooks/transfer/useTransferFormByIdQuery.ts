import { useQuery } from "@tanstack/react-query";
import { getTransferFormById } from "../../api/transactionsApi";
import type { TransferFormDto } from "../../dtos/TransactionDto";

export function useTransferFormByIdQuery(id: string | null, enabled = true) {
  return useQuery<TransferFormDto>({
    enabled: enabled && id != null && id.length > 0,
    queryFn: () => getTransferFormById(id ?? ""),
    queryKey: ["transaction-transfer-form", id],
  });
}
