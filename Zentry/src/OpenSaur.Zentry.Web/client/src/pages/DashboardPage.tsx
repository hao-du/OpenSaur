import { getConfig } from "../infrastructure/config/Config";
import { useAuthSession } from "../features/auth/hooks/AuthContext";
import { DefaultLayout } from "../components/layouts/DefaultLayout";

export function DashboardPage() {
  const config = getConfig();
  const { authSession } = useAuthSession();

  return (
    <DefaultLayout
      subtitle="Protected dashboard backed by frontend auth state from the CoreGate code exchange."
      title="Dashboard"
    >
      <div>
        <p><strong>Authenticated:</strong> {authSession == null ? "no" : "yes"}</p>
        <p><strong>Token type:</strong> {authSession?.tokenType ?? "(missing)"}</p>
        <p><strong>Expires at:</strong> {authSession?.expiresAt ?? "(missing)"}</p>
        <p><strong>Scope:</strong> {authSession?.scope ?? "(missing)"}</p>
        <p><strong>ID token:</strong> {authSession?.idToken == null ? "(missing)" : "issued"}</p>
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
