import { useLayoutEffect, useState } from "react";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { LoginForm } from "../../components/organisms";
import { AuthPageTemplate } from "../../components/templates";
import type { LoginRequest } from "../../features/auth/api/authApi";
import { useLogin } from "../../features/auth/hooks";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import {
  buildFirstPartyAuthorizeUrl,
  continueFirstPartyAuthorizationReturnUrl,
  createFirstPartyAuthorizationState,
  isCurrentAppHostedByIssuer,
  isFirstPartyAuthorizeReturnUrl,
  normalizeAuthReturnUrl,
  startFirstPartyAuthorization
} from "../../features/auth/utils";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const normalizedReturnUrl = normalizeAuthReturnUrl(searchParams.get("returnUrl"));
  const authError = searchParams.get("authError");
  const isIssuerHostedLogin = isCurrentAppHostedByIssuer();
  const [authorizeUrl] = useState(() => buildFirstPartyAuthorizeUrl({
    state: createFirstPartyAuthorizationState(normalizedReturnUrl)
  }));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasStartedRedirect, setHasStartedRedirect] = useState(false);
  const { isLoggingIn, login } = useLogin();
  const { t } = usePreferences();
  const shouldAutoRedirect = !isIssuerHostedLogin && !authError;

  useLayoutEffect(() => {
    authSessionStore.rememberReturnUrl(normalizedReturnUrl);
    if (shouldAutoRedirect && !hasStartedRedirect) {
      setHasStartedRedirect(true);
      startFirstPartyAuthorization(authorizeUrl);
    }
  }, [authorizeUrl, hasStartedRedirect, normalizedReturnUrl, shouldAutoRedirect]);

  async function handleSubmit(values: LoginRequest) {
    setErrorMessage(null);

    try {
      await login(values);

      if (isFirstPartyAuthorizeReturnUrl(normalizedReturnUrl)) {
        continueFirstPartyAuthorizationReturnUrl(normalizedReturnUrl);
        return;
      }

      startFirstPartyAuthorization(authorizeUrl);
    } catch {
      setErrorMessage(t("login.error"));
    }
  }

  return (
    <AuthPageTemplate
      description={t(isIssuerHostedLogin ? "login.description" : "auth.preparingSession")}
      title={t("login.title")}
    >
      {isIssuerHostedLogin ? (
        <LoginForm
          errorMessage={errorMessage}
          isSubmitting={isLoggingIn}
          onSubmit={handleSubmit}
        />
      ) : (
        <Stack spacing={2} alignItems="flex-start">
          <Stack direction="row" spacing={1.5} alignItems="center">
            {shouldAutoRedirect ? <CircularProgress size={20} /> : null}
            <Typography color="text.secondary">
              {t(shouldAutoRedirect ? "auth.preparingSession" : "login.error")}
            </Typography>
          </Stack>
          <Typography color="text.secondary" variant="body2">
            {shouldAutoRedirect
              ? "Continue on the issuer-hosted sign-in page if the browser does not redirect automatically."
              : "The hosted sign-in completed, but the local callback could not establish a session. Review the local OIDC client configuration, then retry manually."}
          </Typography>
          <Button href={authorizeUrl} onClick={() => startFirstPartyAuthorization(authorizeUrl)} variant="contained">
            Continue to Sign In
          </Button>
        </Stack>
      )}
    </AuthPageTemplate>
  );
}
