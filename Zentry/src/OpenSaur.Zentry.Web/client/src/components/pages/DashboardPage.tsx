import { getConfig } from "../../config/Config";
import { DefaultLayout } from "../layouts/DefaultLayout";


export function DashboardPage() {
  const config = getConfig();

  return (
    <DefaultLayout
      subtitle="Backend OIDC runtime config is now loaded into the frontend. Login flow will be added step by step."
      title="Dashboard"
    >
      <div>
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
