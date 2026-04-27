import { useQuery } from "@tanstack/react-query";
import { getPermissions } from "../api/rolesApi";

export function usePermissionsQuery(isEnabled = true) {
  return useQuery({
    enabled: isEnabled,
    queryFn: getPermissions,
    queryKey: ["permissions", "list"]
  });
}
