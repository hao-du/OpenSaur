import { getConfig } from "../../../infrastructure/config/Config";
import { useAuthSession } from "../../auth/hooks/AuthContext";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useCurrentProfileQuery } from "../../profile/hooks/useCurrentProfileQuery";
import { useDashboardSummaryQuery } from "../hooks/useDashboardSummaryQuery";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { BodyText } from "../../../components/atoms/BodyText";
import { LabelText } from "../../../components/atoms/LabelText";
import { MetaText } from "../../../components/atoms/MetaText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { Alert, CircularProgress, Grid, Paper, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
  const navigate = useNavigate();
  const config = getConfig();
  const { authSession } = useAuthSession();
  const { formatDateTime, t } = useSettings();
  const { data: currentProfile } = useCurrentProfileQuery();
  const { data: summary, isError, isLoading, refetch } = useDashboardSummaryQuery();
  const canManage = currentProfile?.canAssignUsers === true || currentProfile?.canEditRoles === true || currentProfile?.isSuperAdministrator === true;

  function renderMetricCard(title: string, value: string | number, subtitle?: string) {
    return (
      <Grid size={{ lg: 3, md: 6, xs: 12 }} sx={{ display: "flex" }}>
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
          <Stack spacing={1} sx={{ width: "100%" }}>
            <MetaText>{title}</MetaText>
            <PageTitleText variant="h3">{value}</PageTitleText>
            {subtitle ? <MetaText>{subtitle}</MetaText> : null}
          </Stack>
        </Paper>
      </Grid>
    );
  }

  function renderSummaryBlock() {
    if (isLoading) {
      return (
        <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 4 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={28} />
            <BodyText>{t("dashboard.loadingSummary")}</BodyText>
          </Stack>
        </Paper>
      );
    }

    if (isError || summary == null) {
      return (
        <Alert
          action={(
            <ActionButton color="inherit" onClick={() => { void refetch(); }} size="small" variant="text">
              {t("action.retry")}
            </ActionButton>
          )}
          severity="error"
        >
          {t("dashboard.unavailableDetail")}
        </Alert>
      );
    }

    if (summary.scope === "global") {
      return (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            {renderMetricCard(t("dashboard.totalWorkspaces"), summary.workspaceCount)}
            {renderMetricCard(t("dashboard.activeWorkspaces"), summary.activeWorkspaceCount)}
            {renderMetricCard(t("dashboard.activeUsers"), summary.activeUserCount)}
            {renderMetricCard(t("dashboard.roleCatalog"), summary.availableRoleCount)}
          </Grid>
          {canManage ? (
            <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 3 }}>
              <Stack direction={{ sm: "row", xs: "column" }} justifyContent="space-between" spacing={2}>
                <Stack spacing={1}>
                  <PageTitleText variant="h6">{t("dashboard.quickActions")}</PageTitleText>
                  <BodyText>{t("dashboard.quickActions.globalDescription")}</BodyText>
                </Stack>
                <Stack direction={{ sm: "row", xs: "column" }} spacing={1.5}>
                  <ActionButton onClick={() => { navigate("/workspaces"); }}>
                    {t("dashboard.quickActions.openWorkspaces")}
                  </ActionButton>
                  <ActionButton onClick={() => { navigate("/roles"); }} variant="outlined">
                    {t("dashboard.quickActions.roleCatalog")}
                  </ActionButton>
                </Stack>
              </Stack>
            </Paper>
          ) : null}
        </Stack>
      );
    }

    const licenseUsage = summary.maxActiveUsers == null
      ? `${summary.activeUserCount} / ${t("dashboard.unlimited")}`
      : `${summary.activeUserCount} / ${summary.maxActiveUsers}`;

    return (
      <Stack spacing={3}>
        <Grid container spacing={2}>
          {renderMetricCard(t("dashboard.availableRoles"), summary.availableRoleCount, summary.workspaceName ?? currentProfile?.workspaceName)}
          {renderMetricCard(t("dashboard.licenseUsage"), licenseUsage)}
          {renderMetricCard(t("dashboard.inactiveUsers"), summary.inactiveUserCount)}
          {renderMetricCard(t("dashboard.activeUsers"), summary.activeUserCount)}
        </Grid>
        {canManage ? (
          <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 3 }}>
            <Stack direction={{ sm: "row", xs: "column" }} justifyContent="space-between" spacing={2}>
              <Stack spacing={1}>
                <PageTitleText variant="h6">{t("dashboard.quickActions")}</PageTitleText>
                <BodyText>{t("dashboard.quickActions.workspaceDescription")}</BodyText>
              </Stack>
              <Stack direction={{ sm: "row", xs: "column" }} spacing={1.5}>
                <ActionButton onClick={() => { navigate("/users"); }}>
                  {t("dashboard.quickActions.openUsers")}
                </ActionButton>
                <ActionButton onClick={() => { navigate("/roles"); }} variant="outlined">
                  {t("dashboard.quickActions.roleCatalog")}
                </ActionButton>
              </Stack>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    );
  }

  return (
    <DefaultLayout
      subtitle={t("dashboard.subtitle")}
      title={t("dashboard.title")}
    >
      <Stack spacing={3}>
        {renderSummaryBlock()}
        <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 3 }}>
          <Stack spacing={2}>
            <Stack spacing={0.75}>
              <PageTitleText variant="h6">{t("dashboard.sessionRuntime")}</PageTitleText>
              <BodyText>
                {t("dashboard.oidcRuntimeConfig")} <code>/app-config.js</code>.
              </BodyText>
            </Stack>
            <Grid container spacing={2}>
              {[
                [t("dashboard.authenticated"), authSession == null ? t("common.no") : t("common.yes")],
                [t("auth.tokenType"), authSession?.tokenType ?? t("common.missing")],
                [t("dashboard.expiresAt"), authSession?.expiresAt ? formatDateTime(authSession.expiresAt) : t("common.missing")],
                [t("auth.scope"), authSession?.scope ?? t("common.missing")],
                [t("auth.idToken"), authSession?.idToken == null ? t("common.missing") : t("dashboard.idTokenIssued")],
                [t("auth.authority"), config.authority],
                [t("auth.clientId"), config.clientId],
                [t("auth.redirectUri"), config.redirectUri],
                [t("auth.postLogoutRedirectUri"), config.postLogoutRedirectUri],
                [t("dashboard.configScope"), config.scope]
              ].map(([label, value]) => (
                <Grid key={label} size={{ md: 6, xs: 12 }}>
                  <Stack spacing={0.5}>
                    <LabelText>{label}</LabelText>
                    <BodyText sx={{ overflowWrap: "anywhere" }}>{value}</BodyText>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Paper>
      </Stack>
    </DefaultLayout>
  );
}
