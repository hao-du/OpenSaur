import { useMutation } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { exitImpersonation } from "../api/authApi";

export function useExitImpersonation() {
  const mutation = useMutation({
    mutationFn: exitImpersonation
  });

  return {
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, "We couldn't exit impersonation. Please try again.")
      : null,
    exitImpersonation: () => mutation.mutateAsync(),
    isExitingImpersonation: mutation.isPending,
    resetError: mutation.reset
  };
}
