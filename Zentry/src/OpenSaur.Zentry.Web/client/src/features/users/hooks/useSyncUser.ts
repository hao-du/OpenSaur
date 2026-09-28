import { useMutation } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { syncUser } from "../api/usersApi";

export function useSyncUser() {
  const mutation = useMutation({
    mutationFn: (userId: string) => syncUser(userId)
  });

  return {
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to sync user to Kafka.") : null,
    isSuccess: mutation.isSuccess,
    isSyncing: mutation.isPending,
    reset: mutation.reset,
    syncUser: (userId: string) => mutation.mutateAsync(userId)
  };
}
