import { useQuery } from "@tanstack/react-query";
import { isApiErrorStatus } from "../../../infrastructure/http/apiErrorHelpers";
import { getRoles } from "../api/rolesApi";

export function useRolesQuery() {
  const query = useQuery({
    queryFn: getRoles,
    queryKey: ["roles", "list"]
  });

  return {
    ...query,
    isForbidden: isApiErrorStatus(query.error, 403),
    isUnauthorized: isApiErrorStatus(query.error, 401)
  };
}
