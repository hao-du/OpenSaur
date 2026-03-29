import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { isSuperAdministrator } from "../../app/router/protectedShellRoutes";
import { ProtectedShellTemplate } from "../../components/templates";
import {
  useCurrentUserState,
  useDashboardSummaryQuery
} from "../../features/auth/hooks";

export function HomePage() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUserState();
  const { data: summary, isError, isLoading } = useDashboardSummaryQuery();
  const shouldShowQuickActions = currentUser?.canManageUsers === true
    || isSuperAdministrator(currentUser?.roles ?? []);

  function renderMetricCard(title: string, value: string | number, subtitle?: string) {
    return (
      <Grid
        size={{ lg: 3, md: 6, xs: 12 }}
        sx={{ display: "flex" }}
      >
        <Paper
          elevation={0}
          sx={{
            border: "1px solid rgba(11,110,79,0.12)",
            display: "flex",
            flex: 1,
            minHeight: 136,
            p: 3
          }}
        >
          <Stack
            spacing={1}
            sx={{ width: "100%" }}
          >
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
            {subtitle ? (
              <Typography color="text.secondary" variant="body2">
                {subtitle}
              </Typography>
            ) : null}
          </Stack>
        </Paper>
      </Grid>
    );
  }

  let content;

  if (isLoading) {
    content = (
      <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 4 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">
            Loading dashboard summary...
          </Typography>
        </Stack>
      </Paper>
    );
  } else if (isError || !summary) {
    content = (
      <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 4 }}>
        <Stack spacing={1}>
          <Typography variant="h6">Dashboard unavailable</Typography>
          <Typography color="text.secondary">
            The dashboard summary could not be loaded right now.
          </Typography>
        </Stack>
      </Paper>
    );
  } else if (summary.scope === "global") {
    content = (
      <Stack spacing={3}>
        <Grid container spacing={2}>
          {renderMetricCard("Total workspaces", summary.workspaceCount)}
          {renderMetricCard("Active workspaces", summary.activeWorkspaceCount)}
          {renderMetricCard("Active users", summary.activeUserCount)}
          {renderMetricCard("Role catalog", summary.availableRoleCount)}
        </Grid>
        {shouldShowQuickActions ? (
          <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 3 }}>
            <Stack
              direction={{ sm: "row", xs: "column" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack spacing={1}>
                <Typography variant="h6">Quick actions</Typography>
                <Typography color="text.secondary">
                  Open the global administration surfaces for workspace, role, and user operations.
                </Typography>
              </Stack>
              <Stack direction={{ sm: "row", xs: "column" }} spacing={1.5}>
                <Button
                  onClick={() => {
                    navigate("/workspaces");
                  }}
                  variant="contained"
                >
                  Open workspaces
                </Button>
                <Button
                  onClick={() => {
                    navigate("/roles");
                  }}
                  variant="outlined"
                >
                  Manage role catalog
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    );
  } else {
    const licenseUsage = summary.maxActiveUsers === null
      ? `${summary.activeUserCount} / Unlimited`
      : `${summary.activeUserCount} / ${summary.maxActiveUsers}`;

    content = (
      <Stack spacing={3}>
        <Grid container spacing={2}>
          {renderMetricCard("Available roles", summary.availableRoleCount)}
          {renderMetricCard("License usage", licenseUsage)}
          {renderMetricCard("Inactive users", summary.inactiveUserCount)}
          {renderMetricCard("Active users", summary.activeUserCount)}
        </Grid>
        {shouldShowQuickActions ? (
          <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 3 }}>
            <Stack
              direction={{ sm: "row", xs: "column" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack spacing={1}>
                <Typography variant="h6">Quick actions</Typography>
                <Typography color="text.secondary">
                  Manage users and roles for the current workspace.
                </Typography>
              </Stack>
              <Stack direction={{ sm: "row", xs: "column" }} spacing={1.5}>
                <Button
                  onClick={() => {
                    navigate("/users");
                  }}
                  variant="contained"
                >
                  Open users
                </Button>
                <Button
                  onClick={() => {
                    navigate("/role-assignments");
                  }}
                  variant="outlined"
                >
                  Open role assignments
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    );
  }

  return (
    <ProtectedShellTemplate title="Dashboard">
      {content}
    </ProtectedShellTemplate>
  );
}
