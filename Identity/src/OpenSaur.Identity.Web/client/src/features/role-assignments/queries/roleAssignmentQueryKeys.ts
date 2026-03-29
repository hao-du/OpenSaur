import type { CurrentUserScope } from "../../auth/queries/currentUserScope";

export const roleAssignmentQueryKeys = {
  all: () => ["roleAssignments"] as const,
  availableRoles: (scope?: CurrentUserScope) => scope
    ? ["roleAssignments", "availableRoles", scope] as const
    : ["roleAssignments", "availableRoles"] as const,
  candidates: (scope?: CurrentUserScope) => scope
    ? ["roleAssignments", "candidates", scope] as const
    : ["roleAssignments", "candidates"] as const,
  detail: (roleId: string) => ["roleAssignments", "detail", roleId] as const
};
