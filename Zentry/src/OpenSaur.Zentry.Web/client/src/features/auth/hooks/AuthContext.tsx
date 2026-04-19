import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import { refreshAuthSession } from "../apis/authApi";
import { AuthSessionDto } from "../dtos/AuthSessionDto";
import { buildLogoutUrl } from "../services/AuthService";
import { clearAuthSession, getAuthSession, saveAuthSession, subscribeAuthStorageChanged } from "../storages/authStorage";
import { getConfig } from "../../../infrastructure/config/Config";

type AuthSessionContextValue = {
  authSession: AuthSessionDto | null;
  handleLogout: () => void;
  isRestoring: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

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
    if (location.pathname === "/auth/callback" || authSession != null) {
      hasTriedRestore.current = false;
      setIsRestoring(false);
      return;
    }

    if (hasTriedRestore.current) {
      setIsRestoring(false);
      return;
    }

    let isMounted = true;

    async function restoreAuthSession() {
      hasTriedRestore.current = true;
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
