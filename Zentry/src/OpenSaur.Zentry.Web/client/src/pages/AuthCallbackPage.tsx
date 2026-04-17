import { useEffect, useRef } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { error, handleCallback, signIn, status } = useAuth();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    void handleCallback();
  }, [handleCallback]);

  useEffect(() => {
    if (status === "authenticated") {
      navigate("/", { replace: true });
    }
  }, [navigate, status]);

  return (
    <Box sx={{ alignItems: "center", backgroundColor: "background.default", display: "grid", minHeight: "100vh", px: 3 }}>
      <Stack
        spacing={2}
        sx={{
          backgroundColor: "background.paper",
          border: "1px solid rgba(11,110,79,0.10)",
          borderRadius: 4,
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
          maxWidth: 544,
          p: 4
        }}
      >
        <Typography color="primary.main" sx={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          CoreGate callback
        </Typography>
        <Typography variant="h4">
          Completing your sign in
        </Typography>
        <Typography color="text.secondary">
          Zentry is validating state, exchanging the authorization code, and loading your profile.
        </Typography>
        {status === "error" && error ? (
          <Alert
            action={(
              <Button color="inherit" onClick={() => { void signIn("/"); }} size="small">
                Retry
              </Button>
            )}
            severity="error"
          >
            {error}
          </Alert>
        ) : null}
      </Stack>
    </Box>
  );
}
