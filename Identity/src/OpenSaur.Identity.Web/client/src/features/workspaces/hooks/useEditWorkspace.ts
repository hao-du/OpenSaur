import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import { roleAssignmentQueryKeys } from "../../role-assignments/queries/roleAssignmentQueryKeys";
import { userQueryKeys } from "../../users/queries/userQueryKeys";
import { editWorkspace } from "../api";
import { workspaceQueryKeys } from "../queries/workspaceQueryKeys";
import type { EditWorkspaceRequest } from "../types";

export function useEditWorkspace() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: editWorkspace,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ exact: true, queryKey: workspaceQueryKeys.list() });
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.dashboardSummary() });
      await queryClient.invalidateQueries({ exact: true, queryKey: userQueryKeys.list() });
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.roleCandidates() });
      await queryClient.invalidateQueries({ queryKey: roleAssignmentQueryKeys.availableRoles() });
    }
  });

  return {
    editWorkspace: (request: EditWorkspaceRequest) => mutation.mutateAsync(request),
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, "We couldn't save the workspace. Please try again.")
      : null,
    isEditing: mutation.isPending,
    resetError: mutation.reset
  };
}
