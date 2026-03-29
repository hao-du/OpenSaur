import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import { i18n } from "../../localization/i18n";
import { roleAssignmentQueryKeys } from "../../role-assignments/queries/roleAssignmentQueryKeys";
import { userQueryKeys } from "../../users/queries/userQueryKeys";
import { createWorkspace } from "../api";
import { workspaceQueryKeys } from "../queries/workspaceQueryKeys";
import type { CreateWorkspaceRequest } from "../types";

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ exact: true, queryKey: workspaceQueryKeys.list() });
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.dashboardSummary() });
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.roleCandidates() });
      await queryClient.invalidateQueries({ queryKey: roleAssignmentQueryKeys.availableRoles() });
    }
  });

  return {
    createWorkspace: (request: CreateWorkspaceRequest) => mutation.mutateAsync(request),
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, i18n.t("workspaces.createError"))
      : null,
    isCreating: mutation.isPending,
    resetError: mutation.reset
  };
}
