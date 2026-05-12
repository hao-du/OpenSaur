import { useQuery } from "@tanstack/react-query";
import { getTransfers } from "../api/transactionsApi";

export function useTransfersQuery() {
  return useQuery({
    queryFn: getTransfers,
    queryKey: ["transfers"]
  });
}
