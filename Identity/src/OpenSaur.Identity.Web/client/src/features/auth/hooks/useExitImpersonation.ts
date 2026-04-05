import { useMutation } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { i18n } from "../../localization/i18n";
import { exitImpersonation, type ExitImpersonationRequest } from "../api/authApi";

export function useExitImpersonation() {
  const mutation = useMutation({
    mutationFn: exitImpersonation
  });

  return {
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, i18n.t("shell.exitImpersonationError"))
      : null,
    exitImpersonation: (request: ExitImpersonationRequest) => mutation.mutateAsync(request),
    isExitingImpersonation: mutation.isPending,
    resetError: mutation.reset
  };
}
