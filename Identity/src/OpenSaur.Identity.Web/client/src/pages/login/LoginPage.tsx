import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthPageTemplate } from "../../components/templates";
import { LoginForm } from "../../components/organisms";
import { useLogin } from "../../features/auth/hooks";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { normalizeAuthReturnUrl, startFirstPartyAuthorization } from "../../features/auth/utils";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import { getApiErrorMessage } from "../../shared/api";

export function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { isLoggingIn, login } = useLogin();
  const { t } = usePreferences();

  async function handleLogin(credentials: { password: string; userName: string; }) {
    const returnUrl = searchParams.get("returnUrl");
    setErrorMessage(null);

    authSessionStore.rememberReturnUrl(normalizeAuthReturnUrl(returnUrl));

    try {
      await login(credentials);
      startFirstPartyAuthorization();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("login.error")));
    }
  }

  return (
    <AuthPageTemplate
      description={t("login.description")}
      title={t("login.title")}
    >
      <LoginForm
        errorMessage={errorMessage}
        isSubmitting={isLoggingIn}
        onSubmit={handleLogin}
      />
    </AuthPageTemplate>
  );
}
