import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { createUser } from "../api";
import { userQueryKeys } from "../queries/userQueryKeys";
import type { CreateUserRequest } from "../types";

export function useCreateUser() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.all() });
    }
  });

  return {
    createUser: (request: CreateUserRequest) => mutation.mutateAsync(request),
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, "We couldn't create the user. Please try again.")
      : null,
    isCreating: mutation.isPending,
    resetError: mutation.reset
  };
}
