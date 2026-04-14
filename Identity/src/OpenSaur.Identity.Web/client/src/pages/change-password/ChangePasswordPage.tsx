import { useState } from "react";
import { Button, Stack } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthPageTemplate } from "../../components/templates";
import { ChangePasswordForm } from "../../components/organisms";
import { useChangePassword, useCurrentUserQuery, useCurrentUserState, useLogout } from "../../features/auth/hooks";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { normalizeAuthReturnUrl } from "../../features/auth/utils";
import { ArrowLeft } from "../../shared/icons";
import { getApiErrorMessage } from "../../shared/api";

function resolveBackTarget(state: unknown) {
  if (typeof state === "object" && state !== null && "from" in state && typeof state.from === "string") {
    return state.from;
  }

  return "/";
}

export function ChangePasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { changePassword, isChangingPassword } = useChangePassword();
  const { data: currentUser } = useCurrentUserState();
  const { clearCurrentUser } = useCurrentUserQuery();
  const { isLoggingOut, logout } = useLogout();
  const { t } = usePreferences();
  const backTarget = resolveBackTarget(location.state);
  const shouldShowBackNavigation = currentUser?.requirePasswordChange !== true;

  async function handleChangePassword(values: {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
  }) {
    const returnUrl = normalizeAuthReturnUrl(authSessionStore.getRememberedReturnUrl());
    setErrorMessage(null);

    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          t("changePassword.error")
        )
      );
      return;
    }

    try {
      await logout();
    } catch {
      // The server-side logout is best-effort here. The client still forces a fresh sign-in flow next.
    }

    clearCurrentUser();
    authSessionStore.clearSession();
    authSessionStore.rememberReturnUrl(returnUrl);
    navigate(`/auth-required?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
  }

  return (
    <AuthPageTemplate
      description={t("changePassword.description")}
      title={t("changePassword.title")}
    >
      <Stack spacing={2}>
        {shouldShowBackNavigation ? (
          <Button
            onClick={() => {
              navigate(backTarget);
            }}
            startIcon={<ArrowLeft size={18} />}
            sx={{ alignSelf: "flex-start" }}
            variant="text"
          >
            {t("auth.back")}
          </Button>
        ) : null}
        <ChangePasswordForm
          errorMessage={errorMessage}
          isSubmitting={isChangingPassword || isLoggingOut}
          onSubmit={handleChangePassword}
        />
      </Stack>
    </AuthPageTemplate>
  );
}
