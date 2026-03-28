import { useQuery } from "@tanstack/react-query";
import { getWorkspaces } from "../api";
import { workspaceQueryKeys } from "../queries/workspaceQueryKeys";

export function useWorkspacesQuery() {
  return useQuery({
    queryFn: getWorkspaces,
    queryKey: workspaceQueryKeys.list()
  });
}
