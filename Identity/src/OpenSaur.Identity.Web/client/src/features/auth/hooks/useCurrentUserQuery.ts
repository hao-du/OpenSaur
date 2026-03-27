import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { currentUserQueryOptions } from "../queries/authQueries";
import { authQueryKeys } from "../queries/authQueryKeys";

export function useCurrentUserQuery() {
  const queryClient = useQueryClient();

  const fetchCurrentUser = useCallback(() => {
    return queryClient.fetchQuery(currentUserQueryOptions());
  }, [queryClient]);

  const clearCurrentUser = useCallback(() => {
    queryClient.removeQueries({ queryKey: authQueryKeys.currentUser() });
  }, [queryClient]);

  return {
    clearCurrentUser,
    fetchCurrentUser
  };
}
