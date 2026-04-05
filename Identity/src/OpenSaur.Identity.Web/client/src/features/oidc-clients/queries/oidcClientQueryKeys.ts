export const oidcClientQueryKeys = {
  all: () => ["oidc-clients"] as const,
  detail: (id: string) => ["oidc-clients", "detail", id] as const,
  list: () => ["oidc-clients", "list"] as const
};
