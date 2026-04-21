import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { deleteOidcClient } from "../api/oidcClientsApi";
import type { DeleteOidcClientRequestDto } from "../dtos/DeleteOidcClientRequestDto";

export function useDeleteOidcClient() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteOidcClient,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ exact: true, queryKey: ["oidc-clients", "list"] });
    }
  });

  return {
    deleteOidcClient: (request: DeleteOidcClientRequestDto) => mutation.mutateAsync(request),
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to deactivate OIDC client.") : null,
    isDeleting: mutation.isPending,
    resetError: mutation.reset
  };
}
