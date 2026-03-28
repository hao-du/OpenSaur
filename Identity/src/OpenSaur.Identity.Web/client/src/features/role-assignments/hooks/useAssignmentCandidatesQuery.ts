import { useQuery } from "@tanstack/react-query";
import { getAssignmentCandidates } from "../api";
import { roleAssignmentQueryKeys } from "../queries/roleAssignmentQueryKeys";

export function useAssignmentCandidatesQuery() {
  return useQuery({
    queryFn: getAssignmentCandidates,
    queryKey: roleAssignmentQueryKeys.candidates()
  });
}
