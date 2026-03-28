import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../api";
import { userQueryKeys } from "../queries/userQueryKeys";

export function useUsersQuery() {
  return useQuery({
    queryFn: getUsers,
    queryKey: userQueryKeys.list()
  });
}
