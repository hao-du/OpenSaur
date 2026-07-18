import { useQuery } from "@tanstack/react-query";
import { getWorkspaceById } from "../api/workspacesApi";

export function useWorkspaceQuery(workspaceId: string | null) {
  return useQuery({
    enabled: workspaceId !== null,
    queryFn: async () => getWorkspaceById(workspaceId!),
    queryKey: ["workspaces", "detail", workspaceId ?? "none"]
  });
}
