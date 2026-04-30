import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getConfig } from "../../../infrastructure/config/Config";
import { clearPkceSession, getPkceSession } from "../storages/pkceStorage";
import { CenteredCardLayout } from "../../../components/layouts/CenteredCardLayout";
import { exchangeAuthCode, refreshAuthSession } from "../apis/authApi";
import { useAuthSession } from "../hooks/AuthContext";
import { readCallbackResult } from "../services/UriService";
import { useSettings } from "../../settings/provider/SettingProvider";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { clearSession, setSession } = useAuthSession();
  const { t } = useSettings();
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
          setCallbackError(getCallbackErrorMessage(error, t("auth.tokenExchangeFailed")));
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
          setCallbackError(getCallbackErrorMessage(error, t("auth.tokenExchangeFailed")));
          clearSession();
        }
      }
    }

    void runExchange();
  }, [callbackResult.code, callbackResult.error, callbackResult.errorDescription, callbackResult.stateMatches, clearSession, navigate, setSession]);

  return (
    <CenteredCardLayout
      description={t("auth.callbackDescription")}
      title={t("auth.callbackTitle")}
    >
      <div>
        <p><strong>{t("auth.status")}:</strong> {status}</p>
        <p><strong>{t("auth.callbackError")}:</strong> {callbackError ?? t("common.none")}</p>
        <p><strong>{t("auth.callbackCode")}:</strong> {callbackResult.code ?? t("common.missing")}</p>
        <p><strong>{t("auth.returnedState")}:</strong> {callbackResult.returnedState ?? t("common.missing")}</p>
        <p><strong>{t("auth.storedPkceState")}:</strong> {callbackResult.storedState ?? t("common.missing")}</p>
        <p><strong>{t("auth.pkceSessionPresent")}:</strong> {callbackResult.hasPkceSession ? t("common.yes") : t("common.no")}</p>
        <p><strong>{t("auth.stateMatches")}:</strong> {callbackResult.stateMatches == null ? t("common.notVerifiable") : callbackResult.stateMatches ? t("common.yes") : t("common.no")}</p>
        <p><strong>{t("auth.error")}:</strong> {callbackResult.error ?? t("common.none")}</p>
        <p><strong>{t("auth.errorDescription")}:</strong> {callbackResult.errorDescription ?? t("common.none")}</p>
      </div>
    </CenteredCardLayout>
  );
}

function getCallbackErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim().length > 0
    ? `Token exchange failed: ${error.message}`
    : fallbackMessage;
}
