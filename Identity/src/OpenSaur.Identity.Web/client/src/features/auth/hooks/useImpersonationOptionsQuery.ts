import { useQuery } from "@tanstack/react-query";
import { getImpersonationOptions } from "../api/authApi";
import { authQueryKeys } from "../queries/authQueryKeys";

export function useImpersonationOptionsQuery(workspaceId: string | null) {
  return useQuery({
    enabled: workspaceId !== null,
    queryFn: () => getImpersonationOptions(workspaceId!),
    queryKey: workspaceId
      ? authQueryKeys.impersonationOptions(workspaceId)
      : ["auth", "impersonation-options", "none"]
  });
}
