import type { QueryClient } from "@tanstack/react-query";
import type { AuthMeResponse } from "../api/authApi";
import { authQueryKeys } from "./authQueryKeys";

export function getCachedCurrentUserId(queryClient: QueryClient) {
  return queryClient.getQueryData<AuthMeResponse>(authQueryKeys.currentUser())?.id ?? null;
}
