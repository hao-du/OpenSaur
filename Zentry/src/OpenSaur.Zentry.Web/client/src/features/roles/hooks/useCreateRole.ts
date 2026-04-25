import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { createRole } from "../api/rolesApi";
import type { CreateRoleRequestDto } from "../dtos/CreateRoleRequestDto";

export function useCreateRole() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ exact: true, queryKey: ["roles", "list"] });
      await queryClient.invalidateQueries({ exact: true, queryKey: ["workspaces", "assignable-roles"] });
    }
  });

  return {
    createRole: (request: CreateRoleRequestDto) => mutation.mutateAsync(request),
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to create role.") : null,
    isCreating: mutation.isPending,
    resetError: mutation.reset
  };
}
