import { useQuery } from "@tanstack/react-query";
import { getRoleUsers } from "../api/rolesApi";

export function useRoleUsersQuery(roleId: string | null) {
  return useQuery({
    enabled: roleId != null,
    queryFn: () => getRoleUsers(roleId!),
    queryKey: ["roles", "users", roleId]
  });
}
