import type { CurrentUserScope } from "../../auth/queries/currentUserScope";

export const userQueryKeys = {
  all: () => ["users"] as const,
  detail: (id: string) => ["users", "detail", id] as const,
  list: () => ["users", "list"] as const,
  roleCandidates: (scope?: CurrentUserScope) => scope
    ? ["users", "role-candidates", scope] as const
    : ["users", "role-candidates"] as const,
  userAssignments: (userId: string) => ["users", "assignments", userId] as const
};
