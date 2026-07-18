import type { QueryClient } from "@tanstack/react-query";

export async function invalidateTransactionQueries(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: ["transactions"] });
  await queryClient.invalidateQueries({ queryKey: ["transaction-cash-flow"] });
  await queryClient.invalidateQueries({ queryKey: ["transaction-bank-account"] });
  await queryClient.invalidateQueries({ queryKey: ["transaction-transfer-form"] });
  await queryClient.invalidateQueries({ queryKey: ["transaction-currency-exchange"] });
}
