import { useMemo, useState } from "react";
import { Grid, Paper, Stack, Tab, Tabs } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useLocation } from "react-router-dom";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { BodyText } from "../../../components/atoms/BodyText";
import { LabelText } from "../../../components/atoms/LabelText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { getConfig } from "../../../infrastructure/config/Config";
import { useAuthSession } from "../../auth/hooks/AuthContext";
import { useCurrentProfileQuery } from "../../profile/hooks/useCurrentProfileQuery";
import { useSettings } from "../provider/SettingProvider";

type TabValue = "oidc" | "profile";

export function SettingsPage() {
  const location = useLocation();
  const config = getConfig();
  const { authSession } = useAuthSession();
  const { data: profile } = useCurrentProfileQuery();
  const { formatDateTime, t } = useSettings();
  const [tab, setTab] = useState<TabValue>(location.pathname === "/profile" ? "profile" : "oidc");

  const oidcItems = useMemo(() => ([
    [t("dashboard.authenticated"), authSession == null ? t("common.no") : t("common.yes")],
    [t("auth.tokenType"), authSession?.tokenType ?? t("common.missing")],
    [t("dashboard.expiresAt"), authSession?.expiresAt ? formatDateTime(authSession.expiresAt) : t("common.missing")],
    [t("auth.scope"), authSession?.scope ?? t("common.missing")],
    [t("auth.idToken"), authSession?.idToken == null ? t("common.missing") : t("dashboard.idTokenIssued")],
    [t("auth.authority"), config.authority],
    [t("auth.clientId"), config.clientId],
    [t("auth.redirectUri"), config.redirectUri],
    [t("auth.postLogoutRedirectUri"), config.postLogoutRedirectUri],
    [t("settings.configuredScope"), config.scope]
  ]), [authSession, config.authority, config.clientId, config.postLogoutRedirectUri, config.redirectUri, config.scope, formatDateTime, t]);

  return (
    <DefaultLayout title={t("settings.title")}>
      <Stack spacing={2}>
        <Paper elevation={0} sx={(theme) => ({ border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`, p: 1 })}>
          <Tabs onChange={(_, value: TabValue) => setTab(value)} value={tab}>
            <Tab label={t("settings.profileTab")} value="profile" />
            <Tab label={t("settings.oidcTab")} value="oidc" />
          </Tabs>
        </Paper>

        {tab === "profile" ? (
          <Paper elevation={0} sx={(theme) => ({ border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`, p: 3 })}>
            <Stack spacing={2}>
              <PageTitleText variant="h6">{t("settings.userProfileTitle")}</PageTitleText>
              <Grid container spacing={2}>
                {[
                  [t("settings.firstName"), profile?.firstName ?? t("common.missing")],
                  [t("settings.lastName"), profile?.lastName ?? t("common.missing")],
                  [t("settings.username"), profile?.userName ?? t("common.missing")],
                  [t("settings.email"), profile?.email ?? t("common.missing")],
                  [t("settings.workspace"), profile?.workspaceName ?? t("common.missing")]
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
        ) : (
          <Paper elevation={0} sx={(theme) => ({ border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`, p: 3 })}>
            <Stack spacing={2}>
              <Stack spacing={0.75}>
                <PageTitleText variant="h6">{t("settings.oidcRuntimeTitle")}</PageTitleText>
                <BodyText>
                  {t("settings.oidcRuntimeDescription")} <code>/app-config.js</code>.
                </BodyText>
              </Stack>
              <Grid container spacing={2}>
                {oidcItems.map(([label, value]) => (
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
        )}
      </Stack>
    </DefaultLayout>
  );
}
