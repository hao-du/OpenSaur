import { Button } from "@mui/material";
import { getConfig } from "../../../infrastructure/config/Config";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { buildAuthorizeUrl } from "../services/AuthService";

export function LoginPage() {
  const config = getConfig();

  async function handleLogin() {
    const authorizeUrl = await buildAuthorizeUrl(config);
    window.location.assign(authorizeUrl);
  }

  return (
    <DefaultLayout
      subtitle="Use CoreGate sign-in to create a frontend auth session for Zentry."
      title="Sign In"
    >
      <div>
        <Button
          onClick={handleLogin}
          variant="contained"
        >
          Login
        </Button>
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
