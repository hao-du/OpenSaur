import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { editWorkspace } from "../api/workspacesApi";
import type { EditWorkspaceRequestDto } from "../dtos/EditWorkspaceRequestDto";

export function useEditWorkspace() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: editWorkspace,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ exact: true, queryKey: ["workspaces", "list"] });
      await queryClient.invalidateQueries({ exact: true, queryKey: ["workspaces", "detail", variables.id] });
    }
  });

  return {
    editWorkspace: (request: EditWorkspaceRequestDto) => mutation.mutateAsync(request),
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to update workspace.") : null,
    isEditing: mutation.isPending,
    resetError: mutation.reset
  };
}
