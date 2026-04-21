import { useQuery } from "@tanstack/react-query";
import { getAssignableWorkspaceRoles } from "../api/workspacesApi";

export function useAssignableWorkspaceRolesQuery() {
  return useQuery({
    queryFn: getAssignableWorkspaceRoles,
    queryKey: ["workspaces", "assignable-roles"]
  });
}
