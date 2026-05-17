import { useMemo, useState } from "react";
import { Grid, Paper, Stack, Tab, Tabs } from "@mui/material";
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
  const { formatDateTime } = useSettings();
  const [tab, setTab] = useState<TabValue>(location.pathname === "/profile" ? "profile" : "oidc");

  const oidcItems = useMemo(() => ([
    ["Authenticated", authSession == null ? "No" : "Yes"],
    ["Token Type", authSession?.tokenType ?? "(Missing)"],
    ["Expires At", authSession?.expiresAt ? formatDateTime(authSession.expiresAt) : "(Missing)"],
    ["Scope", authSession?.scope ?? "(Missing)"],
    ["ID Token", authSession?.idToken == null ? "(Missing)" : "Issued"],
    ["Authority", config.authority],
    ["Client ID", config.clientId],
    ["Redirect URI", config.redirectUri],
    ["Post logout redirect URI", config.postLogoutRedirectUri],
    ["Configured scope", config.scope]
  ]), [authSession, config.authority, config.clientId, config.postLogoutRedirectUri, config.redirectUri, config.scope, formatDateTime]);

  return (
    <DefaultLayout title="Settings">
      <Stack spacing={2}>
        <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 1 }}>
          <Tabs onChange={(_, value: TabValue) => setTab(value)} value={tab}>
            <Tab label="Profile" value="profile" />
            <Tab label="OIDC" value="oidc" />
          </Tabs>
        </Paper>

        {tab === "profile" ? (
          <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 3 }}>
            <Stack spacing={2}>
              <PageTitleText variant="h6">User Profile</PageTitleText>
              <Grid container spacing={2}>
                {[
                  ["First Name", profile?.firstName ?? "(Missing)"],
                  ["Last Name", profile?.lastName ?? "(Missing)"],
                  ["Username", profile?.userName ?? "(Missing)"],
                  ["Email", profile?.email ?? "(Missing)"],
                  ["Workspace", profile?.workspaceName ?? "(Missing)"]
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
          <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 3 }}>
            <Stack spacing={2}>
              <Stack spacing={0.75}>
                <PageTitleText variant="h6">OIDC Session Runtime</PageTitleText>
                <BodyText>
                  Runtime OIDC configuration is loaded from <code>/app-config.js</code>.
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

