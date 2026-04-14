import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  CssBaseline,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useMemo, useState } from "react";

type LoginFormValues = {
  userName: string;
  password: string;
};

type LoginResponse = {
  success: boolean;
  redirectUri?: string | null;
  error?: string | null;
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0d3b66"
    },
    secondary: {
      main: "#ee6c4d"
    },
    background: {
      default: "#f6f1e9"
    }
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
    h3: {
      fontWeight: 700
    }
  },
  shape: {
    borderRadius: 20
  }
});

export function App() {
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
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userName: values.userName,
          password: values.password,
          returnUrl
        })
      });

      const payload = (await response.json()) as LoginResponse;
      if (!response.ok || !payload.success) {
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background:
            "radial-gradient(circle at top left, rgba(238,108,77,0.22), transparent 32%), linear-gradient(135deg, #f6f1e9 0%, #d9e2ec 100%)"
        }}
      >
        <Container maxWidth="sm">
          <Card
            elevation={0}
            sx={{
              border: "1px solid rgba(13,59,102,0.12)",
              boxShadow: "0 24px 70px rgba(13,59,102,0.12)",
              overflow: "hidden"
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #0d3b66 0%, #144f8a 100%)",
                color: "white",
                px: 4,
                py: 5
              }}
            >
              <Typography variant="overline" sx={{ letterSpacing: 2.2 }}>
                CoreGate
              </Typography>
              <Typography variant="h3" sx={{ mt: 1 }}>
                Sign In
              </Typography>
              <Typography sx={{ mt: 1.5, opacity: 0.88 }}>
                Secure sign-in for your identity gateway.
              </Typography>
            </Box>
            <CardContent sx={{ p: 4 }}>
              <Stack component="form" spacing={3} onSubmit={onSubmit}>
                {serverError ? <Alert severity="error">{serverError}</Alert> : null}

                <Controller
                  control={control}
                  name="userName"
                  rules={{ required: "Username is required." }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Username"
                      autoComplete="username"
                      error={fieldState.invalid}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  rules={{ required: "Password is required." }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Password"
                      type="password"
                      autoComplete="current-password"
                      error={fieldState.invalid}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{ minHeight: 52, fontWeight: 700 }}
                >
                  {isSubmitting ? <CircularProgress size={22} color="inherit" /> : "Continue"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
