import { useEffect } from "react";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthPageTemplate } from "../../components/templates";
import { useCurrentUserQuery } from "../../features/auth/hooks/useCurrentUserQuery";
import { useExchangeWebSession } from "../../features/auth/hooks/useExchangeWebSession";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import {
  normalizeAuthReturnUrl,
  readFirstPartyAuthorizationReturnUrl,
  shouldEnforcePasswordChange
} from "../../features/auth/utils";
import type { ExchangeWebSessionResponse } from "../../features/auth/api/authApi";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import { useSyncAuthenticatedPreferences } from "../../features/preferences/hooks";

const exchangeRequestsByCode = new Map<string, Promise<ExchangeWebSessionResponse>>();

function exchangeSessionOnce(
  authorizationCode: string,
  exchangeSession: (request: { code: string; }) => Promise<ExchangeWebSessionResponse>
) {
  const existingRequest = exchangeRequestsByCode.get(authorizationCode);
  if (existingRequest) {
    return existingRequest;
  }

  const request = exchangeSession({ code: authorizationCode })
    .catch(error => {
      exchangeRequestsByCode.delete(authorizationCode);
      throw error;
    });

  exchangeRequestsByCode.set(authorizationCode, request);
  return request;
}

function resolveRememberedReturnUrl(searchParams: URLSearchParams) {
  return readFirstPartyAuthorizationReturnUrl(searchParams.get("state"))
    ?? normalizeAuthReturnUrl(authSessionStore.getRememberedReturnUrl());
}

function buildLoginRedirectUrl(returnUrl: string, authError?: string) {
  const loginSearchParams = new URLSearchParams({
    returnUrl
  });

  if (authError) {
    loginSearchParams.set("authError", authError);
  }

  return `/login?${loginSearchParams.toString()}`;
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authorizationCode = searchParams.get("code");
  const rememberedReturnUrl = resolveRememberedReturnUrl(searchParams);
  const { clearCurrentUser, fetchCurrentUser } = useCurrentUserQuery();
  const { exchangeSession } = useExchangeWebSession();
  const syncAuthenticatedPreferences = useSyncAuthenticatedPreferences();
  const { t } = usePreferences();

  useEffect(() => {
    let isCancelled = false;

    async function completeSignIn() {
      if (!authorizationCode) {
        authSessionStore.clearRememberedReturnUrl();
        navigate(buildLoginRedirectUrl(rememberedReturnUrl), {
          replace: true
        });
        return;
      }

      try {
        const session = await exchangeSessionOnce(authorizationCode, exchangeSession);
        if (isCancelled) {
          return;
        }

        authSessionStore.setAuthenticatedSession(session);

        const currentUser = await fetchCurrentUser();
        await syncAuthenticatedPreferences();
        if (isCancelled) {
          return;
        }

        if (shouldEnforcePasswordChange(currentUser)) {
          authSessionStore.rememberReturnUrl(rememberedReturnUrl);
          navigate("/change-password", { replace: true });
          return;
        }

        authSessionStore.clearRememberedReturnUrl();
        navigate(rememberedReturnUrl, { replace: true });
      } catch {
        clearCurrentUser();
        authSessionStore.clearSession();
        navigate(buildLoginRedirectUrl(rememberedReturnUrl, "exchange_failed"), {
          replace: true
        });
      }
    }

    void completeSignIn();

    return () => {
      isCancelled = true;
    };
  }, [authorizationCode, clearCurrentUser, exchangeSession, fetchCurrentUser, navigate, rememberedReturnUrl, syncAuthenticatedPreferences]);

  return (
    <AuthPageTemplate
      description={t("auth.signingInDescription")}
      title={t("auth.signingInTitle")}
    >
      <Stack
        alignItems="center"
        direction="row"
        spacing={2}
      >
        <CircularProgress size={24} />
        <Typography color="text.secondary">
          {t("auth.preparingAccount")}
        </Typography>
      </Stack>
    </AuthPageTemplate>
  );
}
