import { useQuery } from "@tanstack/react-query";
import { dashboardSummaryQueryOptions } from "../queries/authQueries";
import { useAuthSession } from "../state/useAuthSession";

export function useDashboardSummaryQuery() {
  const session = useAuthSession();

  return useQuery({
    ...dashboardSummaryQueryOptions(),
    enabled: session.status === "authenticated"
  });
}
