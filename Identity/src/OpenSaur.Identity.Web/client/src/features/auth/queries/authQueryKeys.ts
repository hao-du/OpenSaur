export const authQueryKeys = {
  dashboardSummary: () => ["auth", "dashboard"] as const,
  currentUser: () => ["auth", "me"] as const,
  impersonationOptions: (workspaceId: string) => ["auth", "impersonation-options", workspaceId] as const
};
