import { useQuery } from "@tanstack/react-query";
import { getRoleAssignments } from "../api";
import { roleAssignmentQueryKeys } from "../queries/roleAssignmentQueryKeys";

export function useRoleAssignmentsQuery(roleId: string | null) {
  return useQuery({
    enabled: roleId !== null,
    queryFn: () => getRoleAssignments(roleId!),
    queryKey: roleId ? roleAssignmentQueryKeys.detail(roleId) : roleAssignmentQueryKeys.detail("pending")
  });
}
