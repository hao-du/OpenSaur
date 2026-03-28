import { useQuery } from "@tanstack/react-query";
import { getPermissions } from "../api";
import { roleQueryKeys } from "../queries/roleQueryKeys";

export function usePermissionsQuery() {
  return useQuery({
    queryFn: getPermissions,
    queryKey: roleQueryKeys.permissions()
  });
}
