import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthPageTemplate } from "../../components/templates";
import { LoginForm } from "../../components/organisms";
import { useLogin } from "../../features/auth/hooks";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { normalizeAuthReturnUrl, startFirstPartyAuthorization } from "../../features/auth/utils";

export function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { isLoggingIn, login } = useLogin();

  async function handleLogin(credentials: { password: string; userName: string; }) {
    const returnUrl = searchParams.get("returnUrl");
    setErrorMessage(null);

    authSessionStore.rememberReturnUrl(normalizeAuthReturnUrl(returnUrl));

    try {
      await login(credentials);
      startFirstPartyAuthorization();
    } catch {
      setErrorMessage("Sign in failed. Check your credentials and try again.");
    }
  }

  return (
    <AuthPageTemplate
      description="Sign in to continue and pick up where you left off."
      title="Sign in"
    >
      <LoginForm
        errorMessage={errorMessage}
        isSubmitting={isLoggingIn}
        onSubmit={handleLogin}
      />
    </AuthPageTemplate>
  );
}
