import { Stack, Typography } from "@mui/material";
import { AuthPageTemplate } from "../../components/templates";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export function AuthRequiredPage() {
  const { t } = usePreferences();
  const title = t("authRequired.title");
  const description = t("authRequired.description");
  const detail = t("authRequired.detail");

  return (
    <AuthPageTemplate
      description={description === "authRequired.description"
        ? "This application no longer serves a local sign-in form."
        : description}
      title={title === "authRequired.title" ? "Authentication required" : title}
    >
      <Stack spacing={1.5}>
        <Typography color="text.secondary">
          {detail === "authRequired.detail"
            ? "Authentication is handled externally. Open the upstream entry point that starts your sign-in flow, then return to this app after your session is established."
            : detail}
        </Typography>
      </Stack>
    </AuthPageTemplate>
  );
}
