import type { AuthMeResponse } from "../api/authApi";

export type CurrentUserScope = {
  isImpersonating: boolean;
  userId: string | null;
  workspaceName: string | null;
};

export function getCurrentUserScope(
  currentUser: Pick<AuthMeResponse, "id" | "isImpersonating" | "workspaceName"> | null | undefined
): CurrentUserScope {
  return {
    isImpersonating: currentUser?.isImpersonating ?? false,
    userId: currentUser?.id ?? null,
    workspaceName: currentUser?.workspaceName ?? null
  };
}
