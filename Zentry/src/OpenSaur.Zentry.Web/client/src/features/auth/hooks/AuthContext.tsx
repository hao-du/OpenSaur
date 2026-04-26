import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import { refreshAuthSession } from "../apis/authApi";
import { AuthSessionDto } from "../dtos/AuthSessionDto";
import { buildLogoutUrl } from "../services/UriService";
import { clearAuthSession, getAuthSession, saveAuthSession, subscribeAuthStorageChanged } from "../storages/authStorage";
import { getConfig } from "../../../infrastructure/config/Config";

type AuthSessionContextValue = {
  authSession: AuthSessionDto | null;
  handleLogout: () => void;
  isRestoring: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);
const refreshBeforeExpiryMs = 2 * 60 * 1000;

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const location = useLocation();
  const [authSession, setAuthSession] = useState<AuthSessionDto | null>(() => getAuthSession());
  const [isRestoring, setIsRestoring] = useState(() => authSession == null);
  const hasTriedRestore = useRef(false);

  useEffect(() => {
    return subscribeAuthStorageChanged(() => {
      setAuthSession(getAuthSession());
    });
  }, []);

  useEffect(() => {
    if (location.pathname === "/auth/callback") {
      hasTriedRestore.current = false;
      setIsRestoring(false);
      return;
    }

    let isMounted = true;
    let timeoutId: number | undefined;

    async function refreshSession(isRestore: boolean) {
      if (isRestore) {
        hasTriedRestore.current = true;
        setIsRestoring(true);
      }

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
        if (isMounted && isRestore) {
          setIsRestoring(false);
        }
      }
    }

    if (authSession == null) {
      if (hasTriedRestore.current) {
        setIsRestoring(false);
      } else {
        void refreshSession(true);
      }
    } else {
      hasTriedRestore.current = false;
      setIsRestoring(false);

      const expiresAt = Date.parse(authSession.expiresAt);
      const refreshDelay = Math.max(expiresAt - Date.now() - refreshBeforeExpiryMs, 0);

      timeoutId = window.setTimeout(() => {
        void refreshSession(false);
      }, refreshDelay);
    }

    return () => {
      isMounted = false;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [authSession, location.pathname]);

  function handleLogout() {
    const currentSession = authSession;
    clearAuthSession(true);
    window.location.assign(buildLogoutUrl(getConfig(), currentSession?.idToken));
  }

  return (
    <AuthSessionContext.Provider value={{ authSession, handleLogout, isRestoring }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const authContext = useContext(AuthSessionContext);
  if (authContext == null) {
    throw new Error("useAuth must be used within an AuthSessionProvider.");
  }

  return authContext;
}
