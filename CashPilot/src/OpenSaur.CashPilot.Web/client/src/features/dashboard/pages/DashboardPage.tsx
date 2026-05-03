import { getConfig } from "../../../infrastructure/config/Config";
import { useAuthSession } from "../../auth/hooks/AuthContext";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { useSettings } from "../../settings/provider/SettingProvider";
import { BodyText } from "../../../components/atoms/BodyText";
import { LabelText } from "../../../components/atoms/LabelText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { Grid, Paper, Stack } from "@mui/material";

export function DashboardPage() {
  const config = getConfig();
  const { authSession } = useAuthSession();
  const { formatDateTime, t } = useSettings();

  return (
    <DefaultLayout
      subtitle={t("dashboard.subtitle")}
      title={t("dashboard.title")}
    >
      <Stack spacing={3}>
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
