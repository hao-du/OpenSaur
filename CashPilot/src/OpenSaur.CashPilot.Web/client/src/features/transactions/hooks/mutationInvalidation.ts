import type { QueryClient } from "@tanstack/react-query";

export async function invalidateTransactionQueries(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: ["transactions"] });
  await queryClient.invalidateQueries({ queryKey: ["transaction-dashboard"] });
  await queryClient.invalidateQueries({ queryKey: ["transaction-daily-in-out"] });
}
