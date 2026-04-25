import { useQuery } from "@tanstack/react-query";
import { getPermissions } from "../api/rolesApi";

export function usePermissionsQuery() {
  return useQuery({
    queryFn: getPermissions,
    queryKey: ["permissions", "list"]
  });
}
