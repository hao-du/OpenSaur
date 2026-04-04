import { useLayoutEffect, useState } from "react";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { AuthPageTemplate } from "../../components/templates";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { buildFirstPartyAuthorizeUrl, createFirstPartyAuthorizationState, normalizeAuthReturnUrl, startFirstPartyAuthorization } from "../../features/auth/utils";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const [authorizeUrl] = useState(() => buildFirstPartyAuthorizeUrl({
    state: createFirstPartyAuthorizationState()
  }));
  const [hasStartedRedirect, setHasStartedRedirect] = useState(false);
  const { t } = usePreferences();

  useLayoutEffect(() => {
    const returnUrl = searchParams.get("returnUrl");
    authSessionStore.rememberReturnUrl(normalizeAuthReturnUrl(returnUrl));
    if (!hasStartedRedirect) {
      setHasStartedRedirect(true);
      startFirstPartyAuthorization(authorizeUrl);
    }
  }, [authorizeUrl, hasStartedRedirect, searchParams]);

  return (
    <AuthPageTemplate
      description={t("auth.preparingSession")}
      title={t("login.title")}
    >
      <Stack spacing={2} alignItems="flex-start">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography color="text.secondary">
            {t("auth.preparingSession")}
          </Typography>
        </Stack>
        <Typography color="text.secondary" variant="body2">
          Continue on the issuer-hosted sign-in page if the browser does not redirect automatically.
        </Typography>
        <Button href={authorizeUrl} onClick={() => startFirstPartyAuthorization(authorizeUrl)} variant="contained">
          Continue to Sign In
        </Button>
      </Stack>
    </AuthPageTemplate>
  );
}
