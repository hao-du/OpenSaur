import { useQuery } from "@tanstack/react-query";
import { getUserById } from "../api";
import { userQueryKeys } from "../queries/userQueryKeys";

export function useUserQuery(userId: string | null) {
  return useQuery({
    enabled: userId !== null,
    queryFn: () => getUserById(userId!),
    queryKey: userId ? userQueryKeys.detail(userId) : ["users", "detail", "none"]
  });
}
