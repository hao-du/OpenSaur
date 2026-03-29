import { useQuery } from "@tanstack/react-query";
import { useCurrentUserState } from "../../auth/hooks/useCurrentUserState";
import { getCurrentUserScope } from "../../auth/queries/currentUserScope";
import { getRoleCandidates } from "../api";
import { userQueryKeys } from "../queries/userQueryKeys";

export function useRoleCandidatesQuery() {
  const { data: currentUser } = useCurrentUserState();

  return useQuery({
    queryFn: getRoleCandidates,
    queryKey: userQueryKeys.roleCandidates(getCurrentUserScope(currentUser))
  });
}
