import { useQuery } from "@tanstack/react-query";
import { getOidcClientById } from "../api";
import { oidcClientQueryKeys } from "../queries/oidcClientQueryKeys";

export function useOidcClientQuery(oidcClientId: string | null) {
  return useQuery({
    enabled: oidcClientId !== null,
    queryFn: () => getOidcClientById(oidcClientId!),
    queryKey: oidcClientId ? oidcClientQueryKeys.detail(oidcClientId) : ["oidc-clients", "detail", "none"]
  });
}
