import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { editOidcClient } from "../api/oidcClientsApi";
import type { EditOidcClientRequestDto } from "../dtos/EditOidcClientRequestDto";

export function useEditOidcClient() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: editOidcClient,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ exact: true, queryKey: ["oidc-clients", "list"] });
      await queryClient.invalidateQueries({ exact: true, queryKey: ["oidc-clients", "detail", variables.id] });
    }
  });

  return {
    editOidcClient: (request: EditOidcClientRequestDto) => mutation.mutateAsync(request),
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to update OIDC client.") : null,
    isEditing: mutation.isPending,
    resetError: mutation.reset
  };
}
