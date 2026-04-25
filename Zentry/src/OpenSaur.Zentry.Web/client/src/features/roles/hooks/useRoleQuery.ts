import { useQuery } from "@tanstack/react-query";
import { getRoleById } from "../api/rolesApi";

export function useRoleQuery(roleId: string | null) {
  return useQuery({
    enabled: roleId !== null,
    queryFn: () => getRoleById(roleId!),
    queryKey: roleId == null ? ["roles", "detail", "pending"] : ["roles", "detail", roleId]
  });
}
