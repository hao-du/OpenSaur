import { useEffect } from "react";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthPageTemplate } from "../../components/templates";
import { useCurrentUserQuery } from "../../features/auth/hooks/useCurrentUserQuery";
import { useExchangeWebSession } from "../../features/auth/hooks/useExchangeWebSession";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { normalizeAuthReturnUrl } from "../../features/auth/utils";
import type { ExchangeWebSessionResponse } from "../../features/auth/api/authApi";
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

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authorizationCode = searchParams.get("code");
  const { clearCurrentUser, fetchCurrentUser } = useCurrentUserQuery();
  const { exchangeSession } = useExchangeWebSession();
  const syncAuthenticatedPreferences = useSyncAuthenticatedPreferences();

  useEffect(() => {
    let isCancelled = false;

    async function completeSignIn() {
      const rememberedReturnUrl = normalizeAuthReturnUrl(authSessionStore.getRememberedReturnUrl());
      if (!authorizationCode) {
        authSessionStore.clearRememberedReturnUrl();
        navigate(`/login?returnUrl=${encodeURIComponent(rememberedReturnUrl)}`, {
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

        if (currentUser.requirePasswordChange) {
          authSessionStore.rememberReturnUrl(rememberedReturnUrl);
          navigate("/change-password", { replace: true });
          return;
        }

        authSessionStore.clearRememberedReturnUrl();
        navigate(rememberedReturnUrl, { replace: true });
      } catch {
        clearCurrentUser();
        authSessionStore.clearSession();
        navigate(`/login?returnUrl=${encodeURIComponent(rememberedReturnUrl)}`, {
          replace: true
        });
      }
    }

    void completeSignIn();

    return () => {
      isCancelled = true;
    };
  }, [authorizationCode, clearCurrentUser, exchangeSession, fetchCurrentUser, navigate, syncAuthenticatedPreferences]);

  return (
    <AuthPageTemplate
      description="Please wait while we sign you in."
      title="Signing you in"
    >
      <Stack
        alignItems="center"
        direction="row"
        spacing={2}
      >
        <CircularProgress size={24} />
        <Typography color="text.secondary">
          Preparing your account...
        </Typography>
      </Stack>
    </AuthPageTemplate>
  );
}
