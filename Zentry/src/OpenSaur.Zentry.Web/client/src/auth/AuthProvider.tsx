import {
  createContext,
  startTransition,
  useContext,
  useState,
  type PropsWithChildren
} from "react";
import { appEnvironment } from "../config/env";
import {
  beginLogin,
  buildLogoutRedirect,
  completeLogin,
  readStoredAuthSession
} from "./authService";
import type { AppRuntimeConfig, AuthSession } from "./authTypes";

type AuthStatus = "anonymous" | "authenticated" | "error" | "loading";

type AuthContextValue = {
  config: AppRuntimeConfig;
  error: string | null;
  handleCallback: (callbackUrl?: string) => Promise<void>;
  session: AuthSession | null;
  signIn: (redirectPath?: string) => Promise<void>;
  signOut: () => void;
  status: AuthStatus;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredAuthSession());
  const [status, setStatus] = useState<AuthStatus>(session ? "authenticated" : "anonymous");
  const [error, setError] = useState<string | null>(null);

  async function signIn(redirectPath = "/dashboard") {
    setError(null);
    const url = await beginLogin(appEnvironment, redirectPath);
    window.location.assign(url);
  }

  async function handleCallback(callbackUrl = window.location.href) {
    startTransition(() => {
      setError(null);
      setStatus("loading");
    });

    try {
      const nextSession = await completeLogin(appEnvironment, callbackUrl);
      startTransition(() => {
        setSession(nextSession);
        setStatus("authenticated");
      });
    } catch (callbackError) {
      startTransition(() => {
        setError(getErrorMessage(callbackError));
        setSession(null);
        setStatus("error");
      });
    }
  }

  function signOut() {
    const url = buildLogoutRedirect(appEnvironment, session);
    startTransition(() => {
      setError(null);
      setSession(null);
      setStatus("anonymous");
    });
    window.location.assign(url);
  }

  return (
    <AuthContext.Provider
      value={{
        config: appEnvironment,
        error,
        handleCallback,
        session,
        signIn,
        signOut,
        status
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Authentication failed. Please try signing in again.";
}
