import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isPublicAuthRoute } from "../constants/publicAuthRoutes";
import { useCurrentUserQuery } from "./useCurrentUserQuery";
import { authSessionStore, sessionSyncStorageKey } from "../state/authSessionStore";
import { useAuthSession } from "../state/useAuthSession";
import { normalizeAuthReturnUrl, shouldEnforcePasswordChange } from "../utils";
import { useSyncAuthenticatedPreferences } from "../../preferences/hooks";

const changePasswordRoute = "/change-password";

function buildReturnUrl(location: ReturnType<typeof useLocation>) {
  return `${location.pathname}${location.search}${location.hash}`;
}

function resolvePostLoginReturnUrl(location: ReturnType<typeof useLocation>) {
  return location.pathname === changePasswordRoute
    ? normalizeAuthReturnUrl(authSessionStore.getRememberedReturnUrl())
    : buildReturnUrl(location);
}

export function useAuthBootstrap() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuthSession();
  const { clearCurrentUser, fetchCurrentUser } = useCurrentUserQuery();
  const syncAuthenticatedPreferences = useSyncAuthenticatedPreferences();
  const [isBootstrapping, setIsBootstrapping] = useState(
    () => session.status !== "authenticated" && !isPublicAuthRoute(location.pathname)
  );

  const restoreAuthenticatedUser = useCallback(async () => {
    const currentUser = await fetchCurrentUser();
    authSessionStore.setCookieAuthenticatedSession();
    await syncAuthenticatedPreferences();
    return currentUser;
  }, [fetchCurrentUser, syncAuthenticatedPreferences]);

  useEffect(() => {
    if (authSessionStore.getSnapshot().status === "authenticated" || isPublicAuthRoute(location.pathname)) {
      setIsBootstrapping(false);
      return;
    }

    let isCancelled = false;
    setIsBootstrapping(true);

    async function bootstrapProtectedRoute() {
      try {
        const currentUser = await restoreAuthenticatedUser();
        if (isCancelled) {
          return;
        }

        if (shouldEnforcePasswordChange(currentUser)) {
          if (location.pathname !== changePasswordRoute) {
            authSessionStore.rememberReturnUrl(buildReturnUrl(location));
            navigate(changePasswordRoute, { replace: true });
          }

          return;
        }

        if (location.pathname === changePasswordRoute) {
          const returnUrl = authSessionStore.consumeReturnUrl() ?? "/";
          navigate(returnUrl, { replace: true });
        }
      } catch {
        if (!isCancelled) {
          clearCurrentUser();
          authSessionStore.clearSession();
          const returnUrl = resolvePostLoginReturnUrl(location);
          authSessionStore.rememberReturnUrl(returnUrl);
          navigate(`/auth-required?returnUrl=${encodeURIComponent(returnUrl)}`, {
            replace: true
          });
        }
      } finally {
        if (!isCancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrapProtectedRoute();

    return () => {
      isCancelled = true;
    };
  }, [clearCurrentUser, location, navigate, restoreAuthenticatedUser]);

  useEffect(() => {
    async function handleStorageEvent(event: StorageEvent) {
      if (event.key !== sessionSyncStorageKey || !event.newValue) {
        return;
      }

      let payload: { kind?: "clear" | "refresh"; } | null = null;
      try {
        payload = JSON.parse(event.newValue) as { kind?: "clear" | "refresh"; };
      } catch {
        return;
      }

      if (payload?.kind === "clear") {
        clearCurrentUser();
        authSessionStore.clearSession();

        if (!isPublicAuthRoute(location.pathname)) {
          const returnUrl = resolvePostLoginReturnUrl(location);
          authSessionStore.rememberReturnUrl(returnUrl);
          navigate(`/auth-required?returnUrl=${encodeURIComponent(returnUrl)}`, {
            replace: true
          });
        }

        return;
      }

      if (payload?.kind !== "refresh") {
        return;
      }

      try {
        const currentUser = await restoreAuthenticatedUser();

        if (shouldEnforcePasswordChange(currentUser) && location.pathname !== changePasswordRoute) {
          const returnUrl = resolvePostLoginReturnUrl(location);
          authSessionStore.rememberReturnUrl(returnUrl);
          navigate(changePasswordRoute, { replace: true });
        }
      } catch {
        clearCurrentUser();
        authSessionStore.clearSession();

        if (!isPublicAuthRoute(location.pathname)) {
          const returnUrl = resolvePostLoginReturnUrl(location);
          authSessionStore.rememberReturnUrl(returnUrl);
          navigate(`/auth-required?returnUrl=${encodeURIComponent(returnUrl)}`, {
            replace: true
          });
        }
      }
    }

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [clearCurrentUser, location, navigate, restoreAuthenticatedUser]);

  return {
    isBootstrapping,
    session
  };
}
