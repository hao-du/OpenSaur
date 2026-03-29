import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import { roleAssignmentQueryKeys } from "../../role-assignments/queries/roleAssignmentQueryKeys";
import { i18n } from "../../localization/i18n";
import { createUser } from "../api";
import { userQueryKeys } from "../queries/userQueryKeys";
import type { CreateUserRequest } from "../types";

export function useCreateUser() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ exact: true, queryKey: userQueryKeys.list() });
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.dashboardSummary() });
      await queryClient.invalidateQueries({ queryKey: roleAssignmentQueryKeys.candidates() });
    }
  });

  return {
    createUser: (request: CreateUserRequest) => mutation.mutateAsync(request),
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, i18n.t("users.createError"))
      : null,
    isCreating: mutation.isPending,
    resetError: mutation.reset
  };
}
