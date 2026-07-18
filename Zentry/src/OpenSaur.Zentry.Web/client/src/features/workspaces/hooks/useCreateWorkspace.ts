import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { createWorkspace } from "../api/workspacesApi";
import type { CreateWorkspaceRequestDto } from "../dtos/CreateWorkspaceRequestDto";

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ exact: true, queryKey: ["workspaces", "list"] });
    }
  });

  return {
    createWorkspace: (request: CreateWorkspaceRequestDto) => mutation.mutateAsync(request),
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to create workspace.") : null,
    isCreating: mutation.isPending,
    resetError: mutation.reset
  };
}
