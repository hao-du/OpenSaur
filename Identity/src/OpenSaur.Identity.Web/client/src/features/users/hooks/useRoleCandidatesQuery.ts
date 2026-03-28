import { useQuery } from "@tanstack/react-query";
import { getRoleCandidates } from "../api";
import { userQueryKeys } from "../queries/userQueryKeys";

export function useRoleCandidatesQuery() {
  return useQuery({
    queryFn: getRoleCandidates,
    queryKey: userQueryKeys.roleCandidates()
  });
}
