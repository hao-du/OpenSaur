import { Box, Button, Stack, Typography } from "@mui/material";
import { useAuth } from "../auth/useAuth";
import { AuthErrorPanel } from "../components/AuthErrorPanel";

export function AuthRequiredPage() {
  const { error, signIn, status } = useAuth();

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
        <Typography variant="h2">
          Sign in with CoreGate
        </Typography>
        <Typography color="text.secondary">
          Zentry uses CoreGate for browser-based sign-in and returns you to the protected workspace shell once the token exchange completes.
        </Typography>
        {error ? <AuthErrorPanel message={error} onRetry={() => void signIn("/")} /> : null}
        <Box>
          <Button
            disabled={status === "loading"}
            onClick={() => {
              void signIn("/");
            }}
            size="large"
            variant="contained"
          >
            Continue to sign in
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
