import { useQuery } from "@tanstack/react-query";
import { getOidcClientById } from "../api/oidcClientsApi";

export function useOidcClientQuery(oidcClientId: string | null) {
  return useQuery({
    enabled: oidcClientId !== null,
    queryFn: async () => getOidcClientById(oidcClientId!),
    queryKey: ["oidc-clients", "detail", oidcClientId ?? "none"]
  });
}
