import { Button } from "@mui/material";
import { getConfig } from "../../../infrastructure/config/Config";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { buildAuthorizeUrl } from "../services/AuthService";

type PrepareSessionPageProps = {
  isRestoring: boolean;
};

export function PrepareSessionPage({ isRestoring }: PrepareSessionPageProps) {
  const config = getConfig();

  async function handleLogin() {
    const authorizeUrl = await buildAuthorizeUrl(config);
    window.location.assign(authorizeUrl);
  }

  return (
    <DefaultLayout
      subtitle="Zentry first tries to restore an existing CoreGate-backed session before asking you to sign in again."
      title="Prepare Session"
    >
      <div>
        <p><strong>Status:</strong> {isRestoring ? "Restoring existing session..." : "No existing session restored."}</p>
        {!isRestoring ? (
          <Button
            onClick={handleLogin}
            variant="contained"
          >
            Continue to sign in
          </Button>
        ) : null}
        <p>OIDC runtime config loaded from <code>/app-config.js</code>.</p>
        <p><strong>Authority:</strong> {config.authority}</p>
        <p><strong>Client ID:</strong> {config.clientId}</p>
        <p><strong>Redirect URI:</strong> {config.redirectUri}</p>
        <p><strong>Post logout redirect URI:</strong> {config.postLogoutRedirectUri}</p>
        <p><strong>Scope:</strong> {config.scope}</p>
      </div>
    </DefaultLayout>
  );
}
