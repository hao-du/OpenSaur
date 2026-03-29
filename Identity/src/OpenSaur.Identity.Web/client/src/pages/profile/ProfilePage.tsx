import {
  Chip,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { ProtectedShellTemplate } from "../../components/templates";
import { useCurrentUserState } from "../../features/auth/hooks";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

function ProfileField({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography>{value}</Typography>
    </Stack>
  );
}

export function ProfilePage() {
  const { data: currentUser } = useCurrentUserState();
  const { locale, t, timeZone } = usePreferences();

  return (
    <ProtectedShellTemplate
      subtitle={t("profile.subtitle")}
      title={t("profile.title")}
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid rgba(11,110,79,0.12)",
          p: { xs: 3, md: 4 }
        }}
      >
        <Stack spacing={3}>
          <ProfileField
            label={t("profile.userName")}
            value={currentUser?.userName ?? ""}
          />
          <ProfileField
            label={t("profile.email")}
            value={currentUser?.email ?? ""}
          />
          <ProfileField
            label={t("profile.workspace")}
            value={currentUser?.workspaceName ?? ""}
          />
          <Stack spacing={1}>
            <Typography color="text.secondary" variant="body2">
              {t("profile.roles")}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {(currentUser?.roles ?? []).map(role => (
                <Chip key={role} label={role} size="small" />
              ))}
            </Stack>
          </Stack>
          <ProfileField
            label={t("profile.currentLocale")}
            value={locale === "vi"
              ? t("settings.language.vietnamese")
              : t("settings.language.english")}
          />
          <ProfileField
            label={t("profile.currentTimeZone")}
            value={timeZone}
          />
        </Stack>
      </Paper>
    </ProtectedShellTemplate>
  );
}
