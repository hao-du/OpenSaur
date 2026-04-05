import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { LoginForm } from "../../components/organisms";
import { AuthPageTemplate } from "../../components/templates";
import { getApiErrorMessage } from "../../shared/api/getApiErrorMessage";
import type { LoginRequest } from "../../features/auth/api/authApi";
import { useLogin } from "../../features/auth/hooks";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import {
    buildFirstPartyAuthorizeUrl,
  createFirstPartyAuthorizationState,
  executeGoogleRecaptchaAction,
  isIssuerAuthenticationContinuationReturnUrl,
  isCurrentAppHostedByIssuer,
  normalizeAuthReturnUrl,
  prefetchGoogleRecaptcha,
  startFirstPartyAuthorization
} from "../../features/auth/utils";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import { resolveAppBrowserPath } from "../../shared/config/appBasePath";
import { appEnvironment } from "../../shared/config/env";

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

  useEffect(() => {
    if (!isIssuerHostedLogin || !appEnvironment.googleRecaptchaV3.enabled) {
      return;
    }

    prefetchGoogleRecaptcha(appEnvironment.googleRecaptchaV3.siteKey);
  }, [isIssuerHostedLogin]);

  async function handleSubmit(values: LoginRequest) {
    setErrorMessage(null);

    let recaptchaToken: string | undefined;
    if (isIssuerHostedLogin && appEnvironment.googleRecaptchaV3.enabled) {
      try {
        recaptchaToken = await executeGoogleRecaptchaAction(
          appEnvironment.googleRecaptchaV3.siteKey,
          appEnvironment.googleRecaptchaV3.loginAction
        );
      } catch {
        setErrorMessage(t("login.captchaUnavailable"));
        return;
      }
    }

    try {
      await login({
        ...values,
        recaptchaToken
      });

      if (isIssuerAuthenticationContinuationReturnUrl(normalizedReturnUrl)) {
        window.location.assign(normalizedReturnUrl);
        return;
      }

      if (isIssuerHostedLogin) {
        window.location.assign(resolveAppBrowserPath(normalizedReturnUrl));
        return;
      }

      startFirstPartyAuthorization(authorizeUrl);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("login.error")));
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
              {t(shouldAutoRedirect ? "auth.preparingSession" : "auth.issuerExchangeFailedTitle")}
            </Typography>
          </Stack>
          <Typography color="text.secondary" variant="body2">
            {t(shouldAutoRedirect ? "auth.issuerRedirectHint" : "auth.issuerExchangeFailedDetail")}
          </Typography>
          <Button href={authorizeUrl} variant="contained">
            {t("auth.continueIssuerLogin")}
          </Button>
        </Stack>
      )}
    </AuthPageTemplate>
  );
}
