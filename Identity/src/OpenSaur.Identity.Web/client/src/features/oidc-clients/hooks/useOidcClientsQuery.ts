import { useQuery } from "@tanstack/react-query";
import { getOidcClients } from "../api";
import { oidcClientQueryKeys } from "../queries/oidcClientQueryKeys";

export function useOidcClientsQuery() {
  return useQuery({
    queryFn: getOidcClients,
    queryKey: oidcClientQueryKeys.list()
  });
}
