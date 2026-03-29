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
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export function HomePage() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUserState();
  const { data: summary, isError, isLoading } = useDashboardSummaryQuery();
  const { t } = usePreferences();
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
            {t("home.loadingSummary")}
          </Typography>
        </Stack>
      </Paper>
    );
  } else if (isError || !summary) {
    content = (
      <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 4 }}>
        <Stack spacing={1}>
          <Typography variant="h6">{t("home.dashboardUnavailable")}</Typography>
          <Typography color="text.secondary">
            {t("home.dashboardUnavailableDetail")}
          </Typography>
        </Stack>
      </Paper>
    );
  } else if (summary.scope === "global") {
    content = (
      <Stack spacing={3}>
        <Grid container spacing={2}>
          {renderMetricCard(t("home.totalWorkspaces"), summary.workspaceCount)}
          {renderMetricCard(t("home.activeWorkspaces"), summary.activeWorkspaceCount)}
          {renderMetricCard(t("home.activeUsers"), summary.activeUserCount)}
          {renderMetricCard(t("home.roleCatalog"), summary.availableRoleCount)}
        </Grid>
        {shouldShowQuickActions ? (
          <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 3 }}>
            <Stack
              direction={{ sm: "row", xs: "column" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack spacing={1}>
                <Typography variant="h6">{t("home.quickActions")}</Typography>
                <Typography color="text.secondary">
                  {t("home.quickActions.globalDescription")}
                </Typography>
              </Stack>
              <Stack direction={{ sm: "row", xs: "column" }} spacing={1.5}>
                <Button
                  onClick={() => {
                    navigate("/workspaces");
                  }}
                  variant="contained"
                >
                  {t("home.quickActions.openWorkspaces")}
                </Button>
                <Button
                  onClick={() => {
                    navigate("/roles");
                  }}
                  variant="outlined"
                >
                  {t("home.quickActions.roleCatalog")}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    );
  } else {
    const licenseUsage = summary.maxActiveUsers === null
      ? `${summary.activeUserCount} / ${t("home.unlimited")}`
      : `${summary.activeUserCount} / ${summary.maxActiveUsers}`;

    content = (
      <Stack spacing={3}>
        <Grid container spacing={2}>
          {renderMetricCard(t("home.availableRoles"), summary.availableRoleCount)}
          {renderMetricCard(t("home.licenseUsage"), licenseUsage)}
          {renderMetricCard(t("home.inactiveUsers"), summary.inactiveUserCount)}
          {renderMetricCard(t("home.activeUsers"), summary.activeUserCount)}
        </Grid>
        {shouldShowQuickActions ? (
          <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 3 }}>
            <Stack
              direction={{ sm: "row", xs: "column" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack spacing={1}>
                <Typography variant="h6">{t("home.quickActions")}</Typography>
                <Typography color="text.secondary">
                  {t("home.quickActions.workspaceDescription")}
                </Typography>
              </Stack>
              <Stack direction={{ sm: "row", xs: "column" }} spacing={1.5}>
                <Button
                  onClick={() => {
                    navigate("/users");
                  }}
                  variant="contained"
                >
                  {t("home.quickActions.openUsers")}
                </Button>
                <Button
                  onClick={() => {
                    navigate("/role-assignments");
                  }}
                  variant="outlined"
                >
                  {t("home.quickActions.openRoleAssignments")}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    );
  }

  return (
    <ProtectedShellTemplate title={t("home.title")}>
      {content}
    </ProtectedShellTemplate>
  );
}
