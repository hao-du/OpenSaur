export const roleAssignmentQueryKeys = {
  all: () => ["roleAssignments"] as const,
  availableRoles: () => ["roleAssignments", "availableRoles"] as const,
  candidates: () => ["roleAssignments", "candidates"] as const,
  detail: (roleId: string) => ["roleAssignments", "detail", roleId] as const
};
