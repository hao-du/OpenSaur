export const roleQueryKeys = {
  all: () => ["roles"] as const,
  detail: (id: string) => ["roles", "detail", id] as const,
  list: () => ["roles", "list"] as const,
  permissions: () => ["roles", "permissions"] as const
};
