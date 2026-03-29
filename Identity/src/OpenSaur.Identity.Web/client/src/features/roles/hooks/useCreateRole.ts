import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import { roleAssignmentQueryKeys } from "../../role-assignments/queries/roleAssignmentQueryKeys";
import { createRole } from "../api";
import { roleQueryKeys } from "../queries/roleQueryKeys";
import { userQueryKeys } from "../../users/queries/userQueryKeys";
import type { CreateRoleRequest } from "../types";

export function useCreateRole() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ exact: true, queryKey: roleQueryKeys.list() });
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.dashboardSummary() });
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.roleCandidates() });
      await queryClient.invalidateQueries({ queryKey: roleAssignmentQueryKeys.availableRoles() });
    }
  });

  return {
    createRole: (request: CreateRoleRequest) => mutation.mutateAsync(request),
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, "We couldn't create the role. Please try again.")
      : null,
    isCreating: mutation.isPending,
    resetError: mutation.reset
  };
}
