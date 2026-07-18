import { useQuery } from "@tanstack/react-query";
import { isApiErrorStatus } from "../../../infrastructure/http/apiErrorHelpers";
import { getWorkspaces } from "../api/workspacesApi";

export function useWorkspacesQuery() {
  const query = useQuery({
    queryFn: getWorkspaces,
    queryKey: ["workspaces", "list"]
  });

  return {
    ...query,
    isForbidden: isApiErrorStatus(query.error, 403),
    isUnauthorized: isApiErrorStatus(query.error, 401)
  };
}
