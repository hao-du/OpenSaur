import { queryOptions } from "@tanstack/react-query";
import { getCurrentUser, getDashboardSummary } from "../api/authApi";
import { authQueryKeys } from "./authQueryKeys";
import type { CurrentUserScope } from "./currentUserScope";

export function currentUserQueryOptions() {
  return queryOptions({
    queryKey: authQueryKeys.currentUser(),
    queryFn: getCurrentUser
  });
}

export function dashboardSummaryQueryOptions(scope?: CurrentUserScope) {
  return queryOptions({
    queryKey: authQueryKeys.dashboardSummary(scope),
    queryFn: getDashboardSummary
  });
}
