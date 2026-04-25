import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { editRole } from "../api/rolesApi";
import type { EditRoleRequestDto } from "../dtos/EditRoleRequestDto";

export function useEditRole() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: editRole,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ exact: true, queryKey: ["roles", "list"] });
      await queryClient.invalidateQueries({ exact: true, queryKey: ["roles", "detail", variables.id] });
      await queryClient.invalidateQueries({ exact: true, queryKey: ["workspaces", "assignable-roles"] });
    }
  });

  return {
    editRole: (request: EditRoleRequestDto) => mutation.mutateAsync(request),
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to update role.") : null,
    isEditing: mutation.isPending,
    resetError: mutation.reset
  };
}
