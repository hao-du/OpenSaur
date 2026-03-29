import { useQuery } from "@tanstack/react-query";
import { useCurrentUserState } from "../../auth/hooks/useCurrentUserState";
import { getCurrentUserScope } from "../../auth/queries/currentUserScope";
import { getAvailableRoles } from "../api";
import { roleAssignmentQueryKeys } from "../queries/roleAssignmentQueryKeys";

export function useAvailableRolesQuery() {
  const { data: currentUser } = useCurrentUserState();

  return useQuery({
    queryFn: getAvailableRoles,
    queryKey: roleAssignmentQueryKeys.availableRoles(getCurrentUserScope(currentUser))
  });
}
