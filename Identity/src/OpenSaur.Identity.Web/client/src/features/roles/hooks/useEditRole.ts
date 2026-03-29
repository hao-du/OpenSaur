import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import { roleAssignmentQueryKeys } from "../../role-assignments/queries/roleAssignmentQueryKeys";
import { editRole } from "../api";
import { roleQueryKeys } from "../queries/roleQueryKeys";
import { userQueryKeys } from "../../users/queries/userQueryKeys";
import type { EditRoleRequest } from "../types";

export function useEditRole() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: editRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ exact: true, queryKey: roleQueryKeys.list() });
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.dashboardSummary() });
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.roleCandidates() });
      await queryClient.invalidateQueries({ queryKey: roleAssignmentQueryKeys.availableRoles() });
    }
  });

  return {
    editRole: (request: EditRoleRequest) => mutation.mutateAsync(request),
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, "We couldn't save the role. Please try again.")
      : null,
    isEditing: mutation.isPending,
    resetError: mutation.reset
  };
}
