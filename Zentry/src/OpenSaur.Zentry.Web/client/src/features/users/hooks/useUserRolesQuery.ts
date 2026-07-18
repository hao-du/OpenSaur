import { useQuery } from "@tanstack/react-query";
import { getUserRoles } from "../api/usersApi";

export function useUserRolesQuery(userId: string | null) {
  return useQuery({
    enabled: userId !== null,
    queryFn: () => getUserRoles(userId!),
    queryKey: ["users", "roles", userId]
  });
}
