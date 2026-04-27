import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { updateRoleUsers } from "../api/rolesApi";
import type { UpdateRoleUsersRequestDto } from "../dtos/UpdateRoleUsersRequestDto";

type UpdateRoleUsersVariables = {
  roleId: string;
  request: UpdateRoleUsersRequestDto;
};

export function useUpdateRoleUsers() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ roleId, request }: UpdateRoleUsersVariables) => updateRoleUsers(roleId, request),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ exact: true, queryKey: ["roles", "users", variables.roleId] });
    }
  });

  return {
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to update user assignments.") : null,
    isUpdating: mutation.isPending,
    resetError: mutation.reset,
    updateRoleUsers: (variables: UpdateRoleUsersVariables) => mutation.mutateAsync(variables)
  };
}
