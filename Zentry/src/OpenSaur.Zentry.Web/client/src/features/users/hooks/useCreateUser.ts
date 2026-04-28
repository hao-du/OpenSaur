import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { createUser } from "../api/usersApi";
import type { CreateUserRequestDto } from "../dtos/CreateUserRequestDto";

export function useCreateUser() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (request: CreateUserRequestDto) => createUser(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  return {
    createUser: (request: CreateUserRequestDto) => mutation.mutateAsync(request),
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to create user.") : null,
    isCreating: mutation.isPending,
    resetError: mutation.reset
  };
}
