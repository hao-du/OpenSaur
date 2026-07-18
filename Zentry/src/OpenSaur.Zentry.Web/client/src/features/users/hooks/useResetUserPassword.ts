import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { resetUserPassword } from "../api/usersApi";
import type { ResetUserPasswordRequestDto } from "../dtos/ResetUserPasswordRequestDto";

type ResetUserPasswordVariables = {
  request: ResetUserPasswordRequestDto;
  userId: string;
};

export function useResetUserPassword() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ request, userId }: ResetUserPasswordVariables) => resetUserPassword(userId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  return {
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to reset password.") : null,
    isResetting: mutation.isPending,
    resetError: mutation.reset,
    resetUserPassword: (variables: ResetUserPasswordVariables) => mutation.mutateAsync(variables)
  };
}
