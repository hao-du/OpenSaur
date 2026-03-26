import { useEffect, useRef } from "react";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthPageTemplate } from "../../components/templates";
import {
  exchangeWebSession,
  getCurrentUser
} from "../../features/auth/api/authApi";
import { authSessionStore } from "../../features/auth/state/authSessionStore";

export function AuthCallbackPage() {
  const hasStartedRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    let isCancelled = false;

    async function completeSignIn() {
      const authorizationCode = searchParams.get("code");
      const rememberedReturnUrl = authSessionStore.consumeReturnUrl() ?? "/";
      if (!authorizationCode) {
        navigate(`/login?returnUrl=${encodeURIComponent(rememberedReturnUrl)}`, {
          replace: true
        });
        return;
      }

      try {
        const session = await exchangeWebSession({ code: authorizationCode });
        if (isCancelled) {
          return;
        }

        authSessionStore.setAuthenticatedSession(session);

        const currentUser = await getCurrentUser();
        if (isCancelled) {
          return;
        }

        if (currentUser.requirePasswordChange) {
          authSessionStore.rememberReturnUrl(rememberedReturnUrl);
          navigate("/change-password", { replace: true });
          return;
        }

        navigate(rememberedReturnUrl, { replace: true });
      } catch {
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
  }, [navigate, searchParams]);

  return (
    <AuthPageTemplate
      description="The client will complete the authorization code flow here."
      eyebrow="Callback"
      title="Completing sign in"
    >
      <Stack
        alignItems="center"
        direction="row"
        spacing={2}
      >
        <CircularProgress size={24} />
        <Typography color="text.secondary">
          Preparing your session...
        </Typography>
      </Stack>
    </AuthPageTemplate>
  );
}
