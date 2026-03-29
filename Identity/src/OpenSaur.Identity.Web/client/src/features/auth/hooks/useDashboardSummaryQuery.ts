import { useQuery } from "@tanstack/react-query";
import { dashboardSummaryQueryOptions } from "../queries/authQueries";
import { getCurrentUserScope } from "../queries/currentUserScope";
import { useAuthSession } from "../state/useAuthSession";
import { useCurrentUserState } from "./useCurrentUserState";

export function useDashboardSummaryQuery() {
  const session = useAuthSession();
  const { data: currentUser } = useCurrentUserState();

  return useQuery({
    ...dashboardSummaryQueryOptions(getCurrentUserScope(currentUser)),
    enabled: session.status === "authenticated"
  });
}
