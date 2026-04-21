import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { createOidcClient } from "../api/oidcClientsApi";
import type { CreateOidcClientRequestDto } from "../dtos/CreateOidcClientRequestDto";

export function useCreateOidcClient() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createOidcClient,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ exact: true, queryKey: ["oidc-clients", "list"] });
    }
  });

  return {
    createOidcClient: (request: CreateOidcClientRequestDto) => mutation.mutateAsync(request),
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to create OIDC client.") : null,
    isCreating: mutation.isPending,
    resetError: mutation.reset
  };
}
