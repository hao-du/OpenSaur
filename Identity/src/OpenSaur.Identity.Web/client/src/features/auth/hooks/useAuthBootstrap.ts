import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isPublicAuthRoute } from "../constants/publicAuthRoutes";
import { useCurrentUserQuery } from "./useCurrentUserQuery";
import { useRefreshWebSession } from "./useRefreshWebSession";
import { authSessionStore, sessionSyncStorageKey } from "../state/authSessionStore";
import { useAuthSession } from "../state/useAuthSession";
import { normalizeAuthReturnUrl, shouldEnforcePasswordChange } from "../utils";
import { useSyncAuthenticatedPreferences } from "../../preferences/hooks";

const refreshLeadTimeInMilliseconds = 5 * 60 * 1000;
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
  const { refreshSession } = useRefreshWebSession();
  const syncAuthenticatedPreferences = useSyncAuthenticatedPreferences();
  const [isBootstrapping, setIsBootstrapping] = useState(
    () => session.status !== "authenticated" && !isPublicAuthRoute(location.pathname)
  );

  const refreshAuthenticatedUser = useCallback(async () => {
    const refreshedSession = await refreshSession();
    authSessionStore.setAuthenticatedSession(refreshedSession);
    const currentUser = await fetchCurrentUser();
    await syncAuthenticatedPreferences();
    return currentUser;
  }, [fetchCurrentUser, refreshSession, syncAuthenticatedPreferences]);

  useEffect(() => {
    if (authSessionStore.getSnapshot().status === "authenticated" || isPublicAuthRoute(location.pathname)) {
      setIsBootstrapping(false);
      return;
    }

    let isCancelled = false;
    setIsBootstrapping(true);

    async function bootstrapProtectedRoute() {
      try {
        const currentUser = await refreshAuthenticatedUser();
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
          navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
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
  }, [clearCurrentUser, location, navigate, refreshAuthenticatedUser]);

  useEffect(() => {
    if (session.status !== "authenticated" || !session.expiresAt) {
      return;
    }

    const expiresAt = Date.parse(session.expiresAt);
    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
      return;
    }

    const timeoutMilliseconds = Math.max(
      expiresAt - Date.now() - refreshLeadTimeInMilliseconds,
      0
    );

    let isCancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const currentUser = await refreshAuthenticatedUser();
        if (isCancelled) {
          return;
        }

        if (shouldEnforcePasswordChange(currentUser) && location.pathname !== changePasswordRoute) {
          const returnUrl = resolvePostLoginReturnUrl(location);
          authSessionStore.rememberReturnUrl(returnUrl);
          navigate(changePasswordRoute, { replace: true });
        }
      } catch {
        if (isCancelled) {
          return;
        }

        clearCurrentUser();
        authSessionStore.clearSession();

        if (!isPublicAuthRoute(location.pathname)) {
          const nextReturnUrl = resolvePostLoginReturnUrl(location);
          authSessionStore.rememberReturnUrl(nextReturnUrl);
          navigate(`/login?returnUrl=${encodeURIComponent(nextReturnUrl)}`, {
            replace: true
          });
        }
      }
    }, timeoutMilliseconds);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [clearCurrentUser, location, navigate, refreshAuthenticatedUser, session.expiresAt, session.status]);

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
          navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
            replace: true
          });
        }

        return;
      }

      if (payload?.kind !== "refresh") {
        return;
      }

      try {
        const currentUser = await refreshAuthenticatedUser();

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
          navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
            replace: true
          });
        }
      }
    }

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [clearCurrentUser, location, navigate, refreshAuthenticatedUser]);

  return {
    isBootstrapping,
    session
  };
}
