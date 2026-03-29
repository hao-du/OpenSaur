import { queryOptions } from "@tanstack/react-query";
import { getCurrentUser, getDashboardSummary } from "../api/authApi";
import { authQueryKeys } from "./authQueryKeys";

export function currentUserQueryOptions() {
  return queryOptions({
    queryKey: authQueryKeys.currentUser(),
    queryFn: getCurrentUser
  });
}

export function dashboardSummaryQueryOptions() {
  return queryOptions({
    queryKey: authQueryKeys.dashboardSummary(),
    queryFn: getDashboardSummary
  });
}
