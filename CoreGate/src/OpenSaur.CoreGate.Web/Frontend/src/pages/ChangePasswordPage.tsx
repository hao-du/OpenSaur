import {
  Alert,
  Button,
  CircularProgress,
  Stack
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { changePassword } from "../api/auth";
import { Card } from "../components/molecules/Card";
import { FormTextField } from "../components/molecules/FormTextField";
import { PageLayout } from "../components/templates/PageLayout";

type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function ChangePasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const returnUrl = searchParams.get("returnUrl") ?? "/";

  const { control, handleSubmit } = useForm<ChangePasswordFormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
        returnUrl
      });

      if (!payload.success) {
        setServerError(payload.error ?? "Password change failed.");
        return;
      }

      window.location.assign(payload.redirectUri ?? "/");
    } catch {
      setServerError("Unable to reach the identity service.");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <PageLayout background="auth">
      <Card
        title="Change Password"
        subtitle="Update your password before continuing to the identity flow."
      >
        <Stack component="form" spacing={3} onSubmit={onSubmit}>
          {serverError ? <Alert severity="error">{serverError}</Alert> : null}

          <FormTextField
            control={control}
            name="currentPassword"
            label="Current Password"
            rules={{ required: "Current password is required." }}
            type="password"
            autoComplete="current-password"
          />

          <FormTextField
            control={control}
            name="newPassword"
            label="New Password"
            rules={{ required: "New password is required." }}
            type="password"
            autoComplete="new-password"
          />

          <FormTextField
            control={control}
            name="confirmPassword"
            label="Confirm New Password"
            rules={{ required: "Password confirmation is required." }}
            type="password"
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{ minHeight: 52, fontWeight: 700 }}
          >
            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : "Update Password"}
          </Button>
        </Stack>
      </Card>
    </PageLayout>
  );
}
