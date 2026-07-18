import { useQuery } from "@tanstack/react-query";
import { getUsersForImpersonationByWorkspaceId } from "../api/workspacesApi";

export function useUsersForImpersonationByWorkspaceIdQuery(workspaceId: string | null) {
  return useQuery({
    enabled: workspaceId !== null,
    queryFn: async () => getUsersForImpersonationByWorkspaceId(workspaceId!),
    queryKey: ["workspaces", "users-for-impersonation", workspaceId ?? "none"]
  });
}
