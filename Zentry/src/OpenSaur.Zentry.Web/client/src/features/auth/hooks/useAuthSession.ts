import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { refreshAuthSession } from "../apis/authApi";
import { AuthSessionDto } from "../dtos/AuthSessionDto";
import { buildLogoutUrl } from "../services/AuthService";
import { clearAuthSession, getAuthSession, saveAuthSession } from "../storages/authStorage";
import { getConfig } from "../../../infrastructure/config/Config";

export function useAuthSession() {
  const location = useLocation();
  const [authSession, setAuthSession] = useState<AuthSessionDto | null>(() => getAuthSession());
  const [isRestoring, setIsRestoring] = useState(() => authSession == null);

  useEffect(() => {
    if (location.pathname === "/auth/callback" || authSession != null) {
      setIsRestoring(false);
      return;
    }

    let isMounted = true;

    async function restoreAuthSession() {
      setIsRestoring(true);

      try {
        const refreshedSession = await refreshAuthSession(getConfig());
        if (!isMounted) {
          return;
        }

        saveAuthSession(refreshedSession);
        setAuthSession(refreshedSession);
      } catch {
        if (!isMounted) {
          return;
        }

        clearAuthSession();
        setAuthSession(null);
      } finally {
        if (isMounted) {
          setIsRestoring(false);
        }
      }
    }

    void restoreAuthSession();

    return () => {
      isMounted = false;
    };
  }, [authSession, location.pathname]);

  function handleLogout() {
    clearAuthSession();
    setAuthSession(null);
    window.location.assign(buildLogoutUrl(getConfig()));
  }

  return {
    authSession,
    handleLogout,
    isRestoring
  };
}
