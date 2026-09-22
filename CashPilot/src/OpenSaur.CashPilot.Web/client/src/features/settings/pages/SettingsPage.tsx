import { Grid, Paper, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { BodyText } from "../../../components/atoms/BodyText";
import { LabelText } from "../../../components/atoms/LabelText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { useCurrentProfileQuery } from "../../profile/hooks/useCurrentProfileQuery";
import { useSettings } from "../provider/SettingProvider";

export function SettingsPage() {
  const { data: profile } = useCurrentProfileQuery();
  const { t } = useSettings();

  return (
    <DefaultLayout title={t("settings.title")}>
      <Stack spacing={2}>
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
      </Stack>
    </DefaultLayout>
  );
}
