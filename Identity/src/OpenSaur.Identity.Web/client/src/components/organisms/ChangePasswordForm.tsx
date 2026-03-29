import { Alert, Button, CircularProgress, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { ControlledPasswordField } from "../molecules";
import { KeyRound } from "../../shared/icons";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

type ChangePasswordFormValues = {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
};

type ChangePasswordFormProps = {
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onSubmit: (values: ChangePasswordFormValues) => Promise<void>;
};

export function ChangePasswordForm({
  errorMessage,
  isSubmitting = false,
  onSubmit
}: ChangePasswordFormProps) {
  const { t } = usePreferences();
  const {
    control,
    getValues,
    handleSubmit
  } = useForm<ChangePasswordFormValues>({
    defaultValues: {
      confirmPassword: "",
      currentPassword: "",
      newPassword: ""
    }
  });

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      spacing={2.5}
    >
      {errorMessage ? (
        <Alert severity="error">{errorMessage}</Alert>
      ) : null}

      <ControlledPasswordField
        autoComplete="current-password"
        control={control}
        disabled={isSubmitting}
        label={t("changePassword.currentPassword")}
        name="currentPassword"
        rules={{
          required: t("changePassword.currentPasswordRequired")
        }}
      />

      <ControlledPasswordField
        autoComplete="new-password"
        control={control}
        disabled={isSubmitting}
        label={t("changePassword.newPassword")}
        name="newPassword"
        rules={{
          required: t("changePassword.newPasswordRequired")
        }}
      />

      <ControlledPasswordField
        autoComplete="new-password"
        control={control}
        disabled={isSubmitting}
        label={t("changePassword.confirmPassword")}
        name="confirmPassword"
        rules={{
          required: t("changePassword.confirmPasswordRequired"),
          validate: value => value === getValues("newPassword") || t("changePassword.passwordsMustMatch")
        }}
      />

      <Button
        aria-busy={isSubmitting}
        disabled={isSubmitting}
        size="large"
        startIcon={isSubmitting
          ? <CircularProgress color="inherit" size={18} />
          : <KeyRound size={18} />}
        type="submit"
        variant="contained"
      >
        {isSubmitting ? t("changePassword.submitting") : t("changePassword.submit")}
      </Button>
    </Stack>
  );
}
