import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { editWorkspace } from "../api";
import { workspaceQueryKeys } from "../queries/workspaceQueryKeys";
import type { EditWorkspaceRequest } from "../types";

export function useEditWorkspace() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: editWorkspace,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all() });
      await queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.detail(variables.id) });
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
