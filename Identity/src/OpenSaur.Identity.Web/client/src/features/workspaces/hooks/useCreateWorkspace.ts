import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { createWorkspace } from "../api";
import { workspaceQueryKeys } from "../queries/workspaceQueryKeys";
import type { CreateWorkspaceRequest } from "../types";

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all() });
    }
  });

  return {
    createWorkspace: (request: CreateWorkspaceRequest) => mutation.mutateAsync(request),
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, "We couldn't create the workspace. Please try again.")
      : null,
    isCreating: mutation.isPending,
    resetError: mutation.reset
  };
}
