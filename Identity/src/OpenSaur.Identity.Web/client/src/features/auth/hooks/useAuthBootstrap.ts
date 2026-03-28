import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isPublicAuthRoute } from "../constants/publicAuthRoutes";
import { useCurrentUserQuery } from "./useCurrentUserQuery";
import { useRefreshWebSession } from "./useRefreshWebSession";
import { authSessionStore } from "../state/authSessionStore";
import { useAuthSession } from "../state/useAuthSession";
import { normalizeAuthReturnUrl } from "../utils";

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
  const [isBootstrapping, setIsBootstrapping] = useState(
    () => session.status !== "authenticated" && !isPublicAuthRoute(location.pathname)
  );

  useEffect(() => {
    if (session.status === "authenticated" || isPublicAuthRoute(location.pathname)) {
      setIsBootstrapping(false);
      return;
    }

    let isCancelled = false;
    setIsBootstrapping(true);

    async function bootstrapProtectedRoute() {
      try {
        const refreshedSession = await refreshSession();
        if (isCancelled) {
          return;
        }

        authSessionStore.setAuthenticatedSession(refreshedSession);

        const currentUser = await fetchCurrentUser();
        if (isCancelled) {
          return;
        }

        if (currentUser.requirePasswordChange) {
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
  }, [clearCurrentUser, fetchCurrentUser, location, navigate, refreshSession]);

  useEffect(() => {
    if (session.status !== "authenticated" || !session.expiresAt) {
      return;
    }

    const expiresAt = Date.parse(session.expiresAt);
    if (Number.isNaN(expiresAt)) {
      return;
    }

    const timeoutMilliseconds = Math.max(
      expiresAt - Date.now() - refreshLeadTimeInMilliseconds,
      0
    );

    let isCancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const refreshedSession = await refreshSession();
        if (isCancelled) {
          return;
        }

        authSessionStore.setAuthenticatedSession(refreshedSession);
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
  }, [clearCurrentUser, location, navigate, refreshSession, session.expiresAt, session.status]);

  return {
    isBootstrapping,
    session
  };
}
