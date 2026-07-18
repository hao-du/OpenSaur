import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { login } from "../api/auth";
import { Card } from "../components/molecules/Card";
import { FormTextField } from "../components/molecules/FormTextField";
import { PageLayout } from "../components/templates/PageLayout";
import { loadTurnstileScript, renderTurnstile, resetTurnstile } from "../utils/turnstile";

type LoginFormValues = {
  userName: string;
  password: string;
};

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCaptchaEnabled, setIsCaptchaEnabled] = useState(false);
  const [isCaptchaReady, setIsCaptchaReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const widgetIdRef = useRef<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const returnUrl = searchParams.get("returnUrl") ?? "/";

  const { control, handleSubmit } = useForm<LoginFormValues>({
    defaultValues: {
      userName: "",
      password: ""
    }
  });

  useEffect(() => {
    let disposed = false;

    async function initializeTurnstile() {
      try {
        if (!turnstileSiteKey) {
          setIsCaptchaReady(true);
          return;
        }

        setIsCaptchaEnabled(true);
        await loadTurnstileScript();

        if (disposed || !turnstileContainerRef.current) {
          return;
        }

        widgetIdRef.current = renderTurnstile(
          turnstileContainerRef.current,
          turnstileSiteKey,
          (token) => {
            setTurnstileToken(token);
          },
          (errorCode) => {
            console.error("Turnstile widget error:", errorCode ?? "(unknown)");
            setTurnstileToken("");
            setServerError(`Captcha failed to load. Error code: ${errorCode ?? "unknown"}.`);
          });
        setIsCaptchaReady(true);
      } catch (error) {
        if (!disposed) {
          console.error("Failed to initialize Turnstile:", error);
          setServerError("Unable to initialize captcha.");
          setIsCaptchaReady(false);
        }
      }
    }

    void initializeTurnstile();

    return () => {
      disposed = true;
    };
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setServerError(null);

    if (isCaptchaEnabled && !turnstileToken) {
      setServerError("Please complete the captcha challenge.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = await login({
        userName: values.userName,
        password: values.password,
        returnUrl,
        turnstileToken
      });

      if (!payload.success) {
        setServerError(payload.error ?? "Sign-in failed.");
        if (isCaptchaEnabled) {
          setTurnstileToken("");
          resetTurnstile(widgetIdRef.current ?? undefined);
        }
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

          {isCaptchaEnabled ? (
            <Box
              sx={{
                width: "100%",
                "& iframe[src*='challenges.cloudflare.com']": {
                  width: "100% !important",
                  maxWidth: "100% !important",
                  display: "block"
                }
              }}
            >
              <div ref={turnstileContainerRef} />
            </Box>
          ) : null}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting || !isCaptchaReady || (isCaptchaEnabled && !turnstileToken)}
            fullWidth
          >
            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : "Continue"}
          </Button>
        </Stack>
      </Card>
    </PageLayout>
  );
}
