export const authQueryKeys = {
  currentUser: () => ["auth", "me"] as const,
  impersonationOptions: (workspaceId: string) => ["auth", "impersonation-options", workspaceId] as const
};
