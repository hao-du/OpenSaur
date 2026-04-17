import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useAuth } from "../auth/useAuth";
import { AuthErrorPanel } from "../components/AuthErrorPanel";

export function HomePage() {
  const { error, signIn, status } = useAuth();

  useEffect(() => {
    if (status === "anonymous") {
      void signIn("/dashboard");
    }
  }, [signIn, status]);

  if (status === "authenticated") {
    return <Navigate replace to="/dashboard" />;
  }

  if (error) {
    return (
      <Box
        sx={{
          alignItems: "center",
          background: "linear-gradient(135deg, #f4efe6 0%, #fffaf3 55%, #d8eef5 100%)",
          display: "grid",
          minHeight: "100vh",
          px: 3
        }}
      >
        <Stack spacing={2} sx={{ maxWidth: 560 }}>
          <Typography
            color="primary.main"
            sx={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            OpenSaur Zentry
          </Typography>
          <AuthErrorPanel message={error} onRetry={() => void signIn("/dashboard")} />
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        alignItems: "center",
        background: "linear-gradient(135deg, #f4efe6 0%, #fffaf3 55%, #d8eef5 100%)",
        display: "grid",
        minHeight: "100vh",
        px: 3
      }}
    >
      <Stack alignItems="center" spacing={2}>
        <CircularProgress />
        <Typography color="text.secondary">
          Redirecting to CoreGate sign in...
        </Typography>
      </Stack>
    </Box>
  );
}
