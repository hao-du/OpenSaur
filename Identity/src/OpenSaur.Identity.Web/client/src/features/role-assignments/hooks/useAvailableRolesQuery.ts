import { useQuery } from "@tanstack/react-query";
import { getAvailableRoles } from "../api";
import { roleAssignmentQueryKeys } from "../queries/roleAssignmentQueryKeys";

export function useAvailableRolesQuery() {
  return useQuery({
    queryFn: getAvailableRoles,
    queryKey: roleAssignmentQueryKeys.availableRoles()
  });
}
