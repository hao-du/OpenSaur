import { useQuery } from "@tanstack/react-query";
import { useCurrentUserState } from "../../auth/hooks/useCurrentUserState";
import { getCurrentUserScope } from "../../auth/queries/currentUserScope";
import { getAssignmentCandidates } from "../api";
import { roleAssignmentQueryKeys } from "../queries/roleAssignmentQueryKeys";

export function useAssignmentCandidatesQuery() {
  const { data: currentUser } = useCurrentUserState();

  return useQuery({
    queryFn: getAssignmentCandidates,
    queryKey: roleAssignmentQueryKeys.candidates(getCurrentUserScope(currentUser))
  });
}
