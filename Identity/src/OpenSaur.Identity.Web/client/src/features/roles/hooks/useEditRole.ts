import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { editRole } from "../api";
import { roleQueryKeys } from "../queries/roleQueryKeys";
import type { EditRoleRequest } from "../types";

export function useEditRole() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: editRole,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: roleQueryKeys.all() });
      await queryClient.invalidateQueries({ queryKey: roleQueryKeys.detail(variables.id) });
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
