import {
  Alert,
  Button,
  CircularProgress,
  Stack
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { login } from "../api/auth";
import { Card } from "../components/molecules/Card";
import { FormTextField } from "../components/molecules/FormTextField";
import { PageLayout } from "../components/templates/PageLayout";

type LoginFormValues = {
  userName: string;
  password: string;
};

export function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const returnUrl = searchParams.get("returnUrl") ?? "/";

  const { control, handleSubmit } = useForm<LoginFormValues>({
    defaultValues: {
      userName: "",
      password: ""
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = await login({
        userName: values.userName,
        password: values.password,
        returnUrl
      });

      if (!payload.success) {
        setServerError(payload.error ?? "Sign-in failed.");
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
      <Card title="Sign In" subtitle="Secure sign-in for your identity gateway.">
        <Stack component="form" spacing={3} onSubmit={onSubmit}>
          {serverError ? <Alert severity="error">{serverError}</Alert> : null}

          <FormTextField
            control={control}
            name="userName"
            label="Username"
            rules={{ required: "Username is required." }}
            autoComplete="username"
          />

          <FormTextField
            control={control}
            name="password"
            label="Password"
            rules={{ required: "Password is required." }}
            type="password"
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : "Continue"}
          </Button>
        </Stack>
      </Card>
    </PageLayout>
  );
}
