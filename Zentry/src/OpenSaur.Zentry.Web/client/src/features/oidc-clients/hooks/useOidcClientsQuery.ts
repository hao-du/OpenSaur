import { useQuery } from "@tanstack/react-query";
import { isApiErrorStatus } from "../../../infrastructure/http/apiErrorHelpers";
import { getOidcClients } from "../api/oidcClientsApi";

export function useOidcClientsQuery() {
  const query = useQuery({
    queryFn: getOidcClients,
    queryKey: ["oidc-clients", "list"]
  });

  return {
    ...query,
    isUnauthorized: isApiErrorStatus(query.error, 401),
    isForbidden: isApiErrorStatus(query.error, 403)
  };
}
