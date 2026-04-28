import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { editUser } from "../api/usersApi";
import type { EditUserRequestDto } from "../dtos/EditUserRequestDto";

export function useEditUser() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (request: EditUserRequestDto) => editUser(request),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ exact: true, queryKey: ["users", variables.id] });
    }
  });

  return {
    editUser: (request: EditUserRequestDto) => mutation.mutateAsync(request),
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to update user.") : null,
    isEditing: mutation.isPending,
    resetError: mutation.reset
  };
}
