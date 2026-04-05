import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { i18n } from "../../localization/i18n";
import { deleteOidcClient } from "../api";
import { oidcClientQueryKeys } from "../queries/oidcClientQueryKeys";
import type { DeleteOidcClientRequest } from "../types";

export function useDeleteOidcClient() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteOidcClient,
    onSuccess: async (_, request) => {
      await queryClient.invalidateQueries({ exact: true, queryKey: oidcClientQueryKeys.list() });
      await queryClient.removeQueries({ exact: true, queryKey: oidcClientQueryKeys.detail(request.id) });
    }
  });

  return {
    deleteOidcClient: (request: DeleteOidcClientRequest) => mutation.mutateAsync(request),
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, i18n.t("oidcClients.error"))
      : null,
    isDeleting: mutation.isPending,
    resetError: mutation.reset
  };
}
