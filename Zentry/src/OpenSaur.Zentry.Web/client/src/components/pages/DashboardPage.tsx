import { Button } from "@mui/material";
import { getConfig } from "../../config/Config";
import { buildAuthorizeUrl } from "../../services/auth/buildAuthorizeUrl";
import { createPkceSession } from "../../services/auth/pkce";
import { DefaultLayout } from "../layouts/DefaultLayout";


export function DashboardPage() {
  const config = getConfig();

  async function handleLogin() {
    const pkceSession = await createPkceSession();
    const authorizeUrl = buildAuthorizeUrl(config, pkceSession);

    window.location.assign(authorizeUrl);
  }

  return (
    <DefaultLayout
      subtitle="Backend OIDC runtime config is now loaded into the frontend. Login flow will be added step by step."
      title="Dashboard"
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
        <p><strong>Authorize URL:</strong> Generated on login click with PKCE and state.</p>
      </div>
    </DefaultLayout>
  );
}
