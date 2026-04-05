import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { i18n } from "../../localization/i18n";
import { editOidcClient } from "../api";
import { oidcClientQueryKeys } from "../queries/oidcClientQueryKeys";
import type { EditOidcClientRequest } from "../types";

export function useEditOidcClient() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: editOidcClient,
    onSuccess: async (_, request) => {
      await queryClient.invalidateQueries({ exact: true, queryKey: oidcClientQueryKeys.list() });
      await queryClient.invalidateQueries({ exact: true, queryKey: oidcClientQueryKeys.detail(request.id) });
    }
  });

  return {
    editOidcClient: (request: EditOidcClientRequest) => mutation.mutateAsync(request),
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, i18n.t("oidcClients.error"))
      : null,
    isEditing: mutation.isPending,
    resetError: mutation.reset
  };
}
