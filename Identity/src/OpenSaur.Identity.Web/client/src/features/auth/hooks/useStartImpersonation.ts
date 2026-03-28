import { useMutation } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
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
      ? getApiErrorMessage(mutation.error, "We couldn't start impersonation. Please try again.")
      : null,
    isStartingImpersonation: mutation.isPending,
    resetError: mutation.reset,
    startImpersonation: (request: StartImpersonationRequest) => mutation.mutateAsync(request)
  };
}
