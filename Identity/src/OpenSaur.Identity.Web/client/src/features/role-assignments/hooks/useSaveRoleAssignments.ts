import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import { getCachedCurrentUserId } from "../../auth/queries/currentUserCache";
import { i18n } from "../../localization/i18n";
import {
  createUserRoleAssignment,
  editUserRoleAssignment
} from "../api";
import { userQueryKeys } from "../../users/queries/userQueryKeys";
import type { SaveRoleAssignmentsRequest } from "../types";

async function saveRoleAssignments(request: SaveRoleAssignmentsRequest) {
  const selectedUserIds = new Set(request.selectedUserIds);
  const activeAssignments = request.assignments.filter(assignment => assignment.isActive);
  const currentAssignmentUserIds = new Set(activeAssignments.map(assignment => assignment.userId));
  const createdUserIds = request.selectedUserIds
    .filter(userId => !currentAssignmentUserIds.has(userId));
  const deactivatedUserIds = activeAssignments
    .filter(assignment => !selectedUserIds.has(assignment.userId))
    .map(assignment => assignment.userId);

  const createRequests = createdUserIds
    .map(userId => createUserRoleAssignment({
      description: "Assigned through role assignments.",
      roleId: request.roleId,
      userId
    }));

  const deactivateRequests = activeAssignments
    .filter(assignment => deactivatedUserIds.includes(assignment.userId))
    .map(assignment => editUserRoleAssignment({
      description: assignment.description,
      id: assignment.id,
      isActive: false,
      roleId: request.roleId
    }));

  if (createRequests.length === 0 && deactivateRequests.length === 0) {
    return { hasChanges: false };
  }

  await Promise.all([...createRequests, ...deactivateRequests]);

  return {
    affectedUserIds: [...new Set([...createdUserIds, ...deactivatedUserIds])],
    hasChanges: true
  };
}

export function useSaveRoleAssignments() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: saveRoleAssignments,
    onSuccess: async result => {
      if (!result.hasChanges) {
        return;
      }

      await queryClient.invalidateQueries({ exact: true, queryKey: userQueryKeys.list() });

      const currentUserId = getCachedCurrentUserId(queryClient);
      if (currentUserId && result.affectedUserIds?.includes(currentUserId)) {
        await queryClient.invalidateQueries({ exact: true, queryKey: authQueryKeys.currentUser() });
      }
    }
  });

  return {
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, i18n.t("roleAssignments.error"))
      : null,
    isSaving: mutation.isPending,
    resetError: mutation.reset,
    saveRoleAssignments: (request: SaveRoleAssignmentsRequest) => mutation.mutateAsync(request)
  };
}
