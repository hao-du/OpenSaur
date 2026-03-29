import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import { getCachedCurrentUserId } from "../../auth/queries/currentUserCache";
import { roleAssignmentQueryKeys } from "../../role-assignments/queries/roleAssignmentQueryKeys";
import { editUser } from "../api";
import { userQueryKeys } from "../queries/userQueryKeys";
import type { EditUserRequest } from "../types";

export function useEditUser() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: editUser,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ exact: true, queryKey: userQueryKeys.list() });
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.dashboardSummary() });
      await queryClient.invalidateQueries({ queryKey: roleAssignmentQueryKeys.candidates() });

      if (getCachedCurrentUserId(queryClient) === variables.id) {
        await queryClient.invalidateQueries({ exact: true, queryKey: authQueryKeys.currentUser() });
      }
    }
  });

  return {
    editUser: (request: EditUserRequest) => mutation.mutateAsync(request),
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, "We couldn't save the user. Please try again.")
      : null,
    isEditing: mutation.isPending,
    resetError: mutation.reset
  };
}
