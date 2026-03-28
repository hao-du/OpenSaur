import { Alert, Button, CircularProgress, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { LogIn, UserRound } from "../../shared/icons";
import {
  ControlledAuthTextField,
  ControlledPasswordField
} from "../molecules";

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
        label="Username"
        name="userName"
        rules={{
          required: "Username is required."
        }}
      />

      <ControlledPasswordField
        autoComplete="current-password"
        control={control}
        disabled={isSubmitting}
        label="Password"
        name="password"
        rules={{
          required: "Password is required."
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
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </Stack>
  );
}
