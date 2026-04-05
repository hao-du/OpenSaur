import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { i18n } from "../../localization/i18n";
import { createOidcClient } from "../api";
import { oidcClientQueryKeys } from "../queries/oidcClientQueryKeys";
import type { CreateOidcClientRequest } from "../types";

export function useCreateOidcClient() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createOidcClient,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ exact: true, queryKey: oidcClientQueryKeys.list() });
    }
  });

  return {
    createOidcClient: (request: CreateOidcClientRequest) => mutation.mutateAsync(request),
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, i18n.t("oidcClients.error"))
      : null,
    isCreating: mutation.isPending,
    resetError: mutation.reset
  };
}
