import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthPageTemplate } from "../../components/templates";
import { ChangePasswordForm } from "../../components/organisms";
import { useChangePassword, useCurrentUserQuery, useLogout } from "../../features/auth/hooks";
import { authSessionStore } from "../../features/auth/state/authSessionStore";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { changePassword, isChangingPassword } = useChangePassword();
  const { clearCurrentUser } = useCurrentUserQuery();
  const { isLoggingOut, logout } = useLogout();

  async function handleChangePassword(values: {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
  }) {
    const returnUrl = authSessionStore.getRememberedReturnUrl() ?? "/";
    setErrorMessage(null);

    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
    } catch {
      setErrorMessage("Password update failed. Check the current password and try again.");
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
    navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
  }

  return (
    <AuthPageTemplate
      description="Complete the required password rotation before returning to the protected shell."
      eyebrow="Security"
      title="Change password"
    >
      <ChangePasswordForm
        errorMessage={errorMessage}
        isSubmitting={isChangingPassword || isLoggingOut}
        onSubmit={handleChangePassword}
      />
    </AuthPageTemplate>
  );
}
