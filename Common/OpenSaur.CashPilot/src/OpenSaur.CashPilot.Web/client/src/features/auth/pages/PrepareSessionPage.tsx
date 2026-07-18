import { useEffect, useRef } from "react";
import { getConfig } from "../../../infrastructure/config/Config";
import { CenteredCardLayout } from "../../../components/layouts/CenteredCardLayout";
import { buildAuthorizeUrl } from "../services/UriService";
import { useSettings } from "../../settings/provider/SettingProvider";

type PrepareSessionPageProps = {
  isRestoring: boolean;
};

export function PrepareSessionPage({ isRestoring }: PrepareSessionPageProps) {
  const config = getConfig();
  const { t } = useSettings();
  const hasStartedLogin = useRef(false);

  async function handleLogin() {
    const authorizeUrl = await buildAuthorizeUrl(config);
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
        <p><strong>{t("auth.status")}:</strong> {isRestoring
          ? t("auth.prepareRestoring")
          : t("auth.prepareRedirecting")}</p>
        <p>{t("dashboard.oidcRuntimeConfig")} <code>/app-config.js</code>.</p>
        <p><strong>{t("auth.authority")}:</strong> {config.authority}</p>
        <p><strong>{t("auth.clientId")}:</strong> {config.clientId}</p>
        <p><strong>{t("auth.redirectUri")}:</strong> {config.redirectUri}</p>
        <p><strong>{t("auth.postLogoutRedirectUri")}:</strong> {config.postLogoutRedirectUri}</p>
        <p><strong>{t("auth.scope")}:</strong> {config.scope}</p>
      </div>
    </CenteredCardLayout>
  );
}
