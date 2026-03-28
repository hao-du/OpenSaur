import { useQuery } from "@tanstack/react-query";
import { getRoles } from "../api";
import { roleQueryKeys } from "../queries/roleQueryKeys";

export function useRolesQuery() {
  return useQuery({
    queryFn: getRoles,
    queryKey: roleQueryKeys.list()
  });
}
