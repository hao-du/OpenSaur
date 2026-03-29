import { useMutation } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { i18n } from "../../localization/i18n";
import {
  startImpersonation,
  type StartImpersonationRequest
} from "../api/authApi";

export function useStartImpersonation() {
  const mutation = useMutation({
    mutationFn: startImpersonation
  });

  return {
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, i18n.t("workspaces.impersonation.error"))
      : null,
    isStartingImpersonation: mutation.isPending,
    resetError: mutation.reset,
    startImpersonation: (request: StartImpersonationRequest) => mutation.mutateAsync(request)
  };
}
