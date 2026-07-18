import { useQuery } from "@tanstack/react-query";
import { getCashFlowById } from "../../api/transactionsApi";
import type { CashFlowDetailDto } from "../../dtos/TransactionDto";

export function useCashFlowByIdQuery(
  id: string | null,
  enabled = true,
) {
  return useQuery<CashFlowDetailDto>({
    enabled: enabled && id != null && id.length > 0,
    queryFn: () => getCashFlowById(id ?? ""),
    queryKey: ["transaction-cash-flow", id],
  });
}
