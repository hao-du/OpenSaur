import type { CurrentUserScope } from "./currentUserScope";

export const authQueryKeys = {
  dashboardSummary: (scope?: CurrentUserScope) => scope
    ? ["auth", "dashboard", scope] as const
    : ["auth", "dashboard"] as const,
  currentUser: () => ["auth", "me"] as const,
  impersonationOptions: (workspaceId: string) => ["auth", "impersonation-options", workspaceId] as const
};
