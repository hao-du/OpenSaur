import { Chip, Paper, Stack } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { LabelText } from "../../../components/atoms/LabelText";
import { MetaText } from "../../../components/atoms/MetaText";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useCurrentProfileQuery } from "../hooks/useCurrentProfileQuery";

function ProfileField({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <Stack spacing={0.5}>
      <MetaText>{label}</MetaText>
      <LabelText>{value}</LabelText>
    </Stack>
  );
}

export function MyProfilePage() {
  const { data: currentProfile } = useCurrentProfileQuery();
  const { locale, t, timeZone } = useSettings();

  return (
    <DefaultLayout
      subtitle={t("profile.subtitle")}
      title={t("profile.title")}
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid rgba(11,110,79,0.12)",
          p: { md: 4, xs: 3 }
        }}
      >
        <Stack spacing={3}>
          <ProfileField label={t("profile.firstName")} value={currentProfile?.firstName ?? ""} />
          <ProfileField label={t("profile.lastName")} value={currentProfile?.lastName ?? ""} />
          <ProfileField label={t("profile.userName")} value={currentProfile?.userName ?? ""} />
          <ProfileField label={t("profile.email")} value={currentProfile?.email ?? ""} />
          <ProfileField label={t("profile.workspace")} value={currentProfile?.workspaceName ?? ""} />
          <Stack spacing={1}>
            <MetaText>{t("profile.roles")}</MetaText>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {(currentProfile?.roles ?? []).length === 0 ? (
                <BodyText>{t("profile.noRoles")}</BodyText>
              ) : (currentProfile?.roles ?? []).map(role => (
                <Chip key={role} label={role} size="small" />
              ))}
            </Stack>
          </Stack>
          <ProfileField
            label={t("profile.currentLocale")}
            value={locale === "vi" ? t("settings.language.vietnamese") : t("settings.language.english")}
          />
          <ProfileField label={t("profile.currentTimeZone")} value={timeZone} />
        </Stack>
      </Paper>
    </DefaultLayout>
  );
}
