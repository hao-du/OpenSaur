import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../shared/api";
import {
  createUserRoleAssignment,
  editUserRoleAssignment
} from "../../role-assignments/api";
import { roleAssignmentQueryKeys } from "../../role-assignments/queries/roleAssignmentQueryKeys";
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
    return;
  }

  await Promise.all([...createRequests, ...reactivateRequests, ...deactivateRequests]);
}

export function useSaveUserAssignments() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: saveUserAssignments,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.all() });
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(variables.userId) });
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.userAssignments(variables.userId) });
      await queryClient.invalidateQueries({ queryKey: roleAssignmentQueryKeys.all() });
    }
  });

  return {
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, "We couldn't save the user role assignments. Please try again.")
      : null,
    isSaving: mutation.isPending,
    resetError: mutation.reset,
    saveUserAssignments: (request: SaveUserAssignmentsRequest) => mutation.mutateAsync(request)
  };
}
