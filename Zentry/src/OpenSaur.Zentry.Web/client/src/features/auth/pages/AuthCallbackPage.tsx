import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getConfig } from "../../../infrastructure/config/Config";
import { clearPkceSession, getPkceSession } from "../storages/pkceStorage";
import { CenteredCardLayout } from "../../../components/layouts/CenteredCardLayout";
import { exchangeAuthCode, refreshAuthSession } from "../apis/authApi";
import { useAuthSession } from "../hooks/AuthContext";
import { readCallbackResult } from "../services/UriService";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { clearSession, setSession } = useAuthSession();
  const callbackResult = readCallbackResult(window.location.search);
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [status, setStatus] = useState<"exchanging" | "failed" | "restoring">("exchanging");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    async function runExchange() {
      if (callbackResult.error != null) {
        setStatus("failed");
        setCallbackError(callbackResult.errorDescription ?? callbackResult.error);
        clearSession();
        return;
      }

      if (callbackResult.code == null) {
        clearSession();
        clearPkceSession();
        navigate("/prepare-session", { replace: true });
        return;
      }

      if (callbackResult.stateMatches !== true) {
        setStatus("failed");
        setCallbackError("Returned OAuth state did not match the stored PKCE state.");
        clearSession();
        return;
      }

      let config: ReturnType<typeof getConfig> | null = null;

      try {
        config = getConfig();
        const pkceSession = getPkceSession();
        if (pkceSession == null) {
          setStatus("failed");
          setCallbackError("Stored PKCE session is missing.");
          clearSession();
          return;
        }

        const authSession = await exchangeAuthCode(
          config,
          callbackResult.code,
          pkceSession.codeVerifier
        );

        setSession(authSession);
        clearPkceSession();
        navigate("/", { replace: true });
      } catch (error) {
        if (config == null) {
          setStatus("failed");
          setCallbackError(getCallbackErrorMessage(error));
          clearSession();
          return;
        }

        try {
          setStatus("restoring");
          const refreshedSession = await refreshAuthSession(config);

          setSession(refreshedSession);
          clearPkceSession();
          navigate("/", { replace: true });
        } catch {
          setStatus("failed");
          setCallbackError(getCallbackErrorMessage(error));
          clearSession();
        }
      }
    }

    void runExchange();
  }, [callbackResult.code, callbackResult.error, callbackResult.errorDescription, callbackResult.stateMatches, clearSession, navigate, setSession]);

  return (
    <CenteredCardLayout
      description="OAuth callback values and code exchange status are shown below."
      title="Auth Callback"
    >
      <div>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Callback error:</strong> {callbackError ?? "(none)"}</p>
        <p><strong>Code:</strong> {callbackResult.code ?? "(missing)"}</p>
        <p><strong>Returned state:</strong> {callbackResult.returnedState ?? "(missing)"}</p>
        <p><strong>Stored PKCE state:</strong> {callbackResult.storedState ?? "(missing)"}</p>
        <p><strong>PKCE session present:</strong> {callbackResult.hasPkceSession ? "yes" : "no"}</p>
        <p><strong>State matches:</strong> {callbackResult.stateMatches == null ? "(not verifiable)" : callbackResult.stateMatches ? "yes" : "no"}</p>
        <p><strong>Error:</strong> {callbackResult.error ?? "(none)"}</p>
        <p><strong>Error description:</strong> {callbackResult.errorDescription ?? "(none)"}</p>
      </div>
    </CenteredCardLayout>
  );
}

function getCallbackErrorMessage(error: unknown) {
  return error instanceof Error && error.message.trim().length > 0
    ? `Token exchange failed: ${error.message}`
    : "Token exchange failed.";
}
