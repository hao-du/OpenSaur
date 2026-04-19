import { useEffect, useRef } from "react";
import { getConfig } from "../../../infrastructure/config/Config";
import { CenteredCardLayout } from "../../../components/layouts/CenteredCardLayout";
import { buildAuthorizeUrl } from "../services/AuthService";

type PrepareSessionPageProps = {
  isRestoring: boolean;
};

export function PrepareSessionPage({ isRestoring }: PrepareSessionPageProps) {
  const config = getConfig();
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
      description="Zentry first tries to restore an existing CoreGate-backed session before asking you to sign in again."
      title="Prepare Session"
    >
      <div>
        <p><strong>Status:</strong> {isRestoring
          ? "Restoring existing session..."
          : "No existing session restored. Redirecting to sign in..."}</p>
        <p>OIDC runtime config loaded from <code>/app-config.js</code>.</p>
        <p><strong>Authority:</strong> {config.authority}</p>
        <p><strong>Client ID:</strong> {config.clientId}</p>
        <p><strong>Redirect URI:</strong> {config.redirectUri}</p>
        <p><strong>Post logout redirect URI:</strong> {config.postLogoutRedirectUri}</p>
        <p><strong>Scope:</strong> {config.scope}</p>
      </div>
    </CenteredCardLayout>
  );
}
