import { useQuery } from "@tanstack/react-query";
import { getRoleById } from "../api";
import { roleQueryKeys } from "../queries/roleQueryKeys";

export function useRoleQuery(roleId: string | null) {
  return useQuery({
    enabled: roleId !== null,
    queryFn: () => getRoleById(roleId!),
    queryKey: roleId ? roleQueryKeys.detail(roleId) : roleQueryKeys.detail("pending")
  });
}
