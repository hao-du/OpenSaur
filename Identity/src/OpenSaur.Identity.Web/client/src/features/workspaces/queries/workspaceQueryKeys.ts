export const workspaceQueryKeys = {
  all: () => ["workspaces"] as const,
  detail: (id: string) => ["workspaces", "detail", id] as const,
  list: () => ["workspaces", "list"] as const
};
