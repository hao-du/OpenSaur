import { Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ProtectedShellTemplate } from "../../components/templates";
import { useCurrentUserQuery, useCurrentUserState, useLogout } from "../../features/auth/hooks";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { useAuthSession } from "../../features/auth/state/useAuthSession";

export function HomePage() {
  const navigate = useNavigate();
  const session = useAuthSession();
  const { clearCurrentUser } = useCurrentUserQuery();
  const { data: currentUser, isPending } = useCurrentUserState();
  const { isLoggingOut, logout } = useLogout();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Clear the local session even if the server-side logout call fails.
    }

    clearCurrentUser();
    authSessionStore.clearSession();
    authSessionStore.clearRememberedReturnUrl();
    navigate("/login", { replace: true });
  }

  return (
    <ProtectedShellTemplate
      actions={(
        <Button
          disabled={isLoggingOut}
          onClick={() => {
            void handleLogout();
          }}
          startIcon={isLoggingOut ? <CircularProgress color="inherit" size={18} /> : undefined}
          variant="outlined"
        >
          {isLoggingOut ? "Signing out..." : "Logout"}
        </Button>
      )}
      subtitle="This protected shell confirms the hosted auth lifecycle, responsive layout, and logout support."
      title="Identity shell"
    >
      <Stack spacing={3}>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1.2fr) minmax(0, 0.8fr)"
            }
          }}
        >
          <Paper
            elevation={0}
            sx={{
              border: "1px solid rgba(31,60,136,0.12)",
              p: { xs: 3, md: 4 }
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="h5">Hosted auth session</Typography>
              {isPending ? (
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={1.5}
                >
                  <CircularProgress size={18} />
                  <Typography color="text.secondary">Loading current user...</Typography>
                </Stack>
              ) : (
                <>
                  <Typography variant="h4">{currentUser?.userName ?? "Unknown user"}</Typography>
                  <Typography color="text.secondary">
                    You are inside the first-party shell on the same host as the API and OIDC endpoints.
                  </Typography>
                </>
              )}
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              border: "1px solid rgba(11,110,79,0.12)",
              p: { xs: 3, md: 4 }
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="h6">Session details</Typography>
              <Typography color="text.secondary">
                Roles: {currentUser?.roles.join(", ") || "Loading..."}
              </Typography>
              <Typography color="text.secondary">
                Access token expires: {session.expiresAt ?? "Unavailable"}
              </Typography>
              <Typography color="text.secondary">
                Logout clears the hosted cookie session, refresh cookie, and in-memory access token.
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </ProtectedShellTemplate>
  );
}
