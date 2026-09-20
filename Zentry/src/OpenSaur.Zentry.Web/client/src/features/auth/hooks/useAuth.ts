import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentProfileQuery } from "../../profile/hooks/useCurrentProfileQuery";
import type { CurrentProfileDto } from "../../profile/dtos/CurrentProfileDto";

export type AuthOptions = {
  autoRedirect?: boolean;
};

export type AuthState = {
  clearSession: () => void;
  handleLogout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: CurrentProfileDto | null;
  redirectToLogin: (returnUrl?: string) => void;
  refreshSession: () => Promise<unknown>;
};

export function redirectToLogin(returnUrl?: string) {
  const currentPath = returnUrl ?? (window.location.pathname + window.location.search);
  const loginUrl = new URL("/bff/login", window.location.origin);
  loginUrl.searchParams.set("returnUrl", currentPath || "/");
  window.location.assign(loginUrl.toString());
}

export function useAuth(options?: AuthOptions): AuthState {
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError, refetch } = useCurrentProfileQuery();
  const isAuthenticated = !isError && profile != null;

  useEffect(() => {
    if (options?.autoRedirect && !isLoading && !isAuthenticated) {
      redirectToLogin();
    }
  }, [isAuthenticated, isLoading, options?.autoRedirect]);

  const clearSession = () => {
    queryClient.setQueryData(["profile", "current"], null);
  };

  const handleLogout = () => {
    window.location.assign("/bff/logout");
  };

  return {
    clearSession,
    handleLogout,
    isAuthenticated,
    isLoading,
    profile: profile ?? null,
    redirectToLogin,
    refreshSession: refetch,
  };
}



