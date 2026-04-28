import { useQuery } from "@tanstack/react-query";
import { getUserById } from "../api/usersApi";

export function useUserQuery(userId: string | null) {
  return useQuery({
    enabled: userId !== null,
    queryFn: () => getUserById(userId!),
    queryKey: ["users", userId]
  });
}
