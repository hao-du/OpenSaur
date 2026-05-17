import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getConfig } from "../../../infrastructure/config/Config";
import { CenteredCardLayout } from "../../../components/layouts/CenteredCardLayout";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { buildAuthorizeUrl } from "../services/UriService";
import { useSettings } from "../../settings/provider/SettingProvider";

type PrepareSessionPageProps = {
  isRestoring: boolean;
};

export function PrepareSessionPage({ isRestoring }: PrepareSessionPageProps) {
  const config = getConfig();
  const location = useLocation();
  const { t } = useSettings();
  const hasStartedLogin = useRef(false);
  const [showDetails, setShowDetails] = useState(false);
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/";

  async function handleLogin() {
    const authorizeUrl = await buildAuthorizeUrl(config, { returnTo });
    window.location.assign(authorizeUrl);
  }

  useEffect(() => {
    if (isRestoring || hasStartedLogin.current) {
      return;
    }

    hasStartedLogin.current = true;
    void handleLogin();
  }, [isRestoring]);

  return (
    <CenteredCardLayout
      description={t("auth.prepareDescription")}
      title={t("auth.prepareTitle")}
    >
      <div>
        <p>Please wait while we prepare your secure session and sign you in.</p>
        <LinkButton onClick={() => setShowDetails(x => !x)} sx={{ px: 0 }}>
          {showDetails ? "Hide details" : "Show details"}
        </LinkButton>
        {showDetails ? (
          <>
            <p><strong>{t("auth.status")}:</strong> {isRestoring
              ? t("auth.prepareRestoring")
              : t("auth.prepareRedirecting")}</p>
            <p>{t("dashboard.oidcRuntimeConfig")} <code>/app-config.js</code>.</p>
            <p><strong>{t("auth.authority")}:</strong> {config.authority}</p>
            <p><strong>{t("auth.clientId")}:</strong> {config.clientId}</p>
            <p><strong>{t("auth.redirectUri")}:</strong> {config.redirectUri}</p>
            <p><strong>{t("auth.postLogoutRedirectUri")}:</strong> {config.postLogoutRedirectUri}</p>
            <p><strong>{t("auth.scope")}:</strong> {config.scope}</p>
          </>
        ) : null}
      </div>
    </CenteredCardLayout>
  );
}
