import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { assignUserRoles } from "../api/usersApi";
import type { AssignUserRolesRequestDto } from "../dtos/AssignUserRolesRequestDto";

type AssignUserRolesVariables = {
  request: AssignUserRolesRequestDto;
  userId: string;
};

export function useAssignUserRoles() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ request, userId }: AssignUserRolesVariables) => assignUserRoles(userId, request),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ exact: true, queryKey: ["users", "roles", variables.userId] });
    }
  });

  return {
    assignUserRoles: (variables: AssignUserRolesVariables) => mutation.mutateAsync(variables),
    errorMessage: mutation.error ? getApiErrorMessage(mutation.error, "Unable to assign roles.") : null,
    isAssigning: mutation.isPending,
    resetError: mutation.reset
  };
}
