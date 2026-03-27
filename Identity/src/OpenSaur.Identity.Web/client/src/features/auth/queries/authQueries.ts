import { queryOptions } from "@tanstack/react-query";
import { getCurrentUser } from "../api/authApi";
import { authQueryKeys } from "./authQueryKeys";

export function currentUserQueryOptions() {
  return queryOptions({
    queryKey: authQueryKeys.currentUser(),
    queryFn: getCurrentUser
  });
}
