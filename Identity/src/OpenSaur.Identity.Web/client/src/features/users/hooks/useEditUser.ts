import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import { editUser } from "../api";
import { userQueryKeys } from "../queries/userQueryKeys";
import type { EditUserRequest } from "../types";

export function useEditUser() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: editUser,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.all() });
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(variables.id) });
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser() });
    }
  });

  return {
    editUser: (request: EditUserRequest) => mutation.mutateAsync(request),
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, "We couldn't save the user. Please try again.")
      : null,
    isEditing: mutation.isPending,
    resetError: mutation.reset
  };
}
