import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import { refreshAuthSession } from "../apis/authApi";
import { AuthSessionDto } from "../dtos/AuthSessionDto";
import { buildLogoutUrl } from "../services/UriService";
import { setClientAccessToken } from "../../../infrastructure/http/client";
import { getConfig } from "../../../infrastructure/config/Config";

type AuthSessionContextValue = {
  accessToken: string | null;
  authSession: AuthSessionDto | null;
  clearSession: () => void;
  handleLogout: () => void;
  idToken: string | null;
  isRestoring: boolean;
  setSession: (authSession: AuthSessionDto) => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);
const refreshBeforeExpiryMs = 2 * 60 * 1000;

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const location = useLocation();
  const [authSession, setAuthSession] = useState<AuthSessionDto | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const hasTriedRestore = useRef(false);

  const setSession = useCallback((nextAuthSession: AuthSessionDto) => {
    setAccessToken(nextAuthSession.accessToken);
    setIdToken(nextAuthSession.idToken);
    setAuthSession(nextAuthSession);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setIdToken(null);
    setAuthSession(null);
  }, []);

  useEffect(() => {
    setClientAccessToken(accessToken);
  }, [accessToken]);

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

        setSession(refreshedSession);
      } catch {
        if (!isMounted) {
          return;
        }

        clearSession();
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
  }, [authSession, clearSession, location.pathname, setSession]);

  const handleLogout = useCallback(() => {
    const currentSession = authSession;
    clearSession();
    window.location.assign(buildLogoutUrl(getConfig(), currentSession?.idToken));
  }, [authSession, clearSession]);

  const contextValue = useMemo<AuthSessionContextValue>(() => ({
    accessToken,
    authSession,
    clearSession,
    handleLogout,
    idToken,
    isRestoring,
    setSession
  }), [accessToken, authSession, clearSession, handleLogout, idToken, isRestoring, setSession]);

  return (
    <AuthSessionContext.Provider value={contextValue}>
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
