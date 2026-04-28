import { useQuery } from "@tanstack/react-query";
import { isApiErrorStatus } from "../../../infrastructure/http/apiErrorHelpers";
import { getUsers } from "../api/usersApi";

export function useUsersQuery() {
  const query = useQuery({
    queryFn: getUsers,
    queryKey: ["users"]
  });

  return {
    ...query,
    isForbidden: isApiErrorStatus(query.error, 403),
    isUnauthorized: isApiErrorStatus(query.error, 401)
  };
}
