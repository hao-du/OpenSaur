import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { createRole } from "../api";
import { roleQueryKeys } from "../queries/roleQueryKeys";
import type { CreateRoleRequest } from "../types";

export function useCreateRole() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleQueryKeys.all() });
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
