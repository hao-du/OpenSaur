import { useQuery } from "@tanstack/react-query";
import { getWorkspaceById } from "../api";
import { workspaceQueryKeys } from "../queries/workspaceQueryKeys";

export function useWorkspaceQuery(workspaceId: string | null) {
  return useQuery({
    enabled: workspaceId !== null,
    queryFn: () => getWorkspaceById(workspaceId!),
    queryKey: workspaceId ? workspaceQueryKeys.detail(workspaceId) : workspaceQueryKeys.detail("pending")
  });
}
