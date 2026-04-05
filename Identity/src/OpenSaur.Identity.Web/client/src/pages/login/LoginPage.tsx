import { useLayoutEffect, useRef, useState } from "react";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { LoginForm } from "../../components/organisms";
import { AuthPageTemplate } from "../../components/templates";
import type { LoginRequest } from "../../features/auth/api/authApi";
import { useLogin } from "../../features/auth/hooks";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import {
  buildFirstPartyAuthorizeUrl,
  createFirstPartyAuthorizationState,
  isIssuerAuthenticationContinuationReturnUrl,
  isCurrentAppHostedByIssuer,
  normalizeAuthReturnUrl,
  startFirstPartyAuthorization
} from "../../features/auth/utils";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const normalizedReturnUrl = normalizeAuthReturnUrl(searchParams.get("returnUrl"));
  const hasExchangeError = searchParams.get("authError") !== null;
  const isIssuerHostedLogin = isCurrentAppHostedByIssuer();
  const [authorizeUrl] = useState(() => buildFirstPartyAuthorizeUrl({
    state: createFirstPartyAuthorizationState(normalizedReturnUrl)
  }));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasStartedRedirectRef = useRef(false);
  const { isLoggingIn, login } = useLogin();
  const { t } = usePreferences();
  const shouldAutoRedirect = !isIssuerHostedLogin && !hasExchangeError;

  useLayoutEffect(() => {
    authSessionStore.rememberReturnUrl(normalizedReturnUrl);
    if (!shouldAutoRedirect || hasStartedRedirectRef.current) {
      return;
    }

    hasStartedRedirectRef.current = true;
    startFirstPartyAuthorization(authorizeUrl);
  }, [authorizeUrl, normalizedReturnUrl, shouldAutoRedirect]);

  async function handleSubmit(values: LoginRequest) {
    setErrorMessage(null);

    try {
      await login(values);

      if (isIssuerAuthenticationContinuationReturnUrl(normalizedReturnUrl)) {
        window.location.assign(normalizedReturnUrl);
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
              : "The hosted sign-in completed, but the local app could not finish the issuer-backed session exchange. Review the issuer URL, client registration, and token-endpoint reachability, then retry manually."}
          </Typography>
          <Button href={authorizeUrl} variant="contained">
            Continue to Sign In
          </Button>
        </Stack>
      )}
    </AuthPageTemplate>
  );
}
