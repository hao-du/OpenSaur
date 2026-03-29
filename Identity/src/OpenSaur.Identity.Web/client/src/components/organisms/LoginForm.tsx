import { Alert, Button, CircularProgress, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { LogIn, UserRound } from "../../shared/icons";
import {
  ControlledAuthTextField,
  ControlledPasswordField
} from "../molecules";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

type LoginFormValues = {
  password: string;
  userName: string;
};

type LoginFormProps = {
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onSubmit: (values: LoginFormValues) => Promise<void>;
};

export function LoginForm({
  errorMessage,
  isSubmitting = false,
  onSubmit
}: LoginFormProps) {
  const { t } = usePreferences();
  const {
    control,
    handleSubmit
  } = useForm<LoginFormValues>({
    defaultValues: {
      password: "",
      userName: ""
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

      <ControlledAuthTextField
        autoComplete="username"
        control={control}
        disabled={isSubmitting}
        icon={<UserRound size={18} />}
        label={t("login.userNameLabel")}
        name="userName"
        rules={{
          required: t("login.userNameRequired")
        }}
      />

      <ControlledPasswordField
        autoComplete="current-password"
        control={control}
        disabled={isSubmitting}
        label={t("login.passwordLabel")}
        name="password"
        rules={{
          required: t("login.passwordRequired")
        }}
      />

      <Button
        aria-busy={isSubmitting}
        disabled={isSubmitting}
        size="large"
        startIcon={isSubmitting
          ? <CircularProgress color="inherit" size={18} />
          : <LogIn size={18} />}
        type="submit"
        variant="contained"
      >
        {isSubmitting ? t("login.submitting") : t("login.submit")}
      </Button>
    </Stack>
  );
}
