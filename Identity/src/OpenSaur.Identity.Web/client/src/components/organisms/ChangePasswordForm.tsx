import { Alert, Button, CircularProgress, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { ControlledPasswordField } from "../molecules";
import { KeyRound } from "../../shared/icons";

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
        label="Current password"
        name="currentPassword"
        rules={{
          required: "Current password is required."
        }}
      />

      <ControlledPasswordField
        autoComplete="new-password"
        control={control}
        disabled={isSubmitting}
        label="New password"
        name="newPassword"
        rules={{
          required: "New password is required."
        }}
      />

      <ControlledPasswordField
        autoComplete="new-password"
        control={control}
        disabled={isSubmitting}
        label="Confirm new password"
        name="confirmPassword"
        rules={{
          required: "Please confirm your new password.",
          validate: value => value === getValues("newPassword") || "Passwords must match."
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
        {isSubmitting ? "Updating password..." : "Update password"}
      </Button>
    </Stack>
  );
}
