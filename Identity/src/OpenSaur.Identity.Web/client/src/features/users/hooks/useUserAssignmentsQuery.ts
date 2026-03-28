import { useQuery } from "@tanstack/react-query";
import { getUserAssignments } from "../api";
import { userQueryKeys } from "../queries/userQueryKeys";

export function useUserAssignmentsQuery(userId: string | null) {
  return useQuery({
    enabled: userId !== null,
    queryFn: () => getUserAssignments(userId!),
    queryKey: userId ? userQueryKeys.userAssignments(userId) : ["users", "assignments", "none"]
  });
}
