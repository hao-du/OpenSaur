import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import {
  createUserRoleAssignment,
  editUserRoleAssignment
} from "../api";
import { roleAssignmentQueryKeys } from "../queries/roleAssignmentQueryKeys";
import type { SaveRoleAssignmentsRequest } from "../types";

async function saveRoleAssignments(request: SaveRoleAssignmentsRequest) {
  const selectedUserIds = new Set(request.selectedUserIds);
  const activeAssignments = request.assignments.filter(assignment => assignment.isActive);
  const currentAssignmentUserIds = new Set(activeAssignments.map(assignment => assignment.userId));

  const createRequests = request.selectedUserIds
    .filter(userId => !currentAssignmentUserIds.has(userId))
    .map(userId => createUserRoleAssignment({
      description: "Assigned through role assignments.",
      roleId: request.roleId,
      userId
    }));

  const deactivateRequests = activeAssignments
    .filter(assignment => !selectedUserIds.has(assignment.userId))
    .map(assignment => editUserRoleAssignment({
      description: assignment.description,
      id: assignment.id,
      isActive: false,
      roleId: request.roleId
    }));

  await Promise.all([...createRequests, ...deactivateRequests]);
}

export function useSaveRoleAssignments() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: saveRoleAssignments,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: roleAssignmentQueryKeys.all() });
      await queryClient.invalidateQueries({ queryKey: roleAssignmentQueryKeys.detail(variables.roleId) });
    }
  });

  return {
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, "We couldn't save the role assignments. Please try again.")
      : null,
    isSaving: mutation.isPending,
    resetError: mutation.reset,
    saveRoleAssignments: (request: SaveRoleAssignmentsRequest) => mutation.mutateAsync(request)
  };
}
