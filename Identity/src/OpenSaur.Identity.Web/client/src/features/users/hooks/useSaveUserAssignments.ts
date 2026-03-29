import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import {
  createUserRoleAssignment,
  editUserRoleAssignment
} from "../../role-assignments/api";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import { getCachedCurrentUserId } from "../../auth/queries/currentUserCache";
import { i18n } from "../../localization/i18n";
import { userQueryKeys } from "../queries/userQueryKeys";
import type { SaveUserAssignmentsRequest } from "../types";

async function saveUserAssignments(request: SaveUserAssignmentsRequest) {
  const selectedRoleIds = new Set(request.selectedRoleIds);
  const activeAssignments = request.assignments.filter(assignment => assignment.isActive);
  const inactiveAssignments = request.assignments.filter(assignment => !assignment.isActive);
  const activeRoleIds = new Set(activeAssignments.map(assignment => assignment.roleId));
  const inactiveAssignmentsByRoleId = new Map(
    inactiveAssignments.map(assignment => [assignment.roleId, assignment])
  );

  const createRequests = request.selectedRoleIds
    .filter(roleId => !activeRoleIds.has(roleId) && !inactiveAssignmentsByRoleId.has(roleId))
    .map(roleId => createUserRoleAssignment({
      description: "Assigned through user management.",
      roleId,
      userId: request.userId
    }));

  const reactivateRequests = request.selectedRoleIds
    .map(roleId => inactiveAssignmentsByRoleId.get(roleId))
    .filter(assignment => assignment !== undefined)
    .map(assignment => editUserRoleAssignment({
      description: assignment.description,
      id: assignment.id,
      isActive: true,
      roleId: assignment.roleId
    }));

  const deactivateRequests = activeAssignments
    .filter(assignment => !selectedRoleIds.has(assignment.roleId))
    .map(assignment => editUserRoleAssignment({
      description: assignment.description,
      id: assignment.id,
      isActive: false,
      roleId: assignment.roleId
    }));

  if (createRequests.length === 0 && reactivateRequests.length === 0 && deactivateRequests.length === 0) {
    return { hasChanges: false };
  }

  await Promise.all([...createRequests, ...reactivateRequests, ...deactivateRequests]);

  return { hasChanges: true };
}

export function useSaveUserAssignments() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: saveUserAssignments,
    onSuccess: async (result, variables) => {
      if (!result.hasChanges) {
        return;
      }

      await queryClient.invalidateQueries({ exact: true, queryKey: userQueryKeys.list() });
      await queryClient.invalidateQueries({ exact: true, queryKey: userQueryKeys.userAssignments(variables.userId) });

      if (getCachedCurrentUserId(queryClient) === variables.userId) {
        await queryClient.invalidateQueries({ exact: true, queryKey: authQueryKeys.currentUser() });
      }
    }
  });

  return {
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, i18n.t("users.roleAssignmentsError"))
      : null,
    isSaving: mutation.isPending,
    resetError: mutation.reset,
    saveUserAssignments: (request: SaveUserAssignmentsRequest) => mutation.mutateAsync(request)
  };
}
