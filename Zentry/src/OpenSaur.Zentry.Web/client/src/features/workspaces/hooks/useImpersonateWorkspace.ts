import { useMutation } from "@tanstack/react-query";
import { getConfig } from "../../../infrastructure/config/Config";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { impersonateWorkspace } from "../../auth/apis/authApi";

export function useImpersonateWorkspace() {
  const mutation = useMutation({
    mutationFn: (workspaceId: string) => impersonateWorkspace(getConfig(), workspaceId)
  });

  return {
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to impersonate workspace.") : null,
    impersonateWorkspace: (workspaceId: string) => mutation.mutateAsync(workspaceId),
    impersonatingWorkspaceId: mutation.variables ?? null,
    isImpersonating: mutation.isPending,
    resetError: mutation.reset
  };
}
