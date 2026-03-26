import { CircularProgress, Stack, Typography } from "@mui/material";
import { AuthPageTemplate } from "../../components/templates";

export function AuthCallbackPage() {
  return (
    <AuthPageTemplate
      description="The client will complete the authorization code flow here."
      eyebrow="Callback"
      title="Completing sign in"
    >
      <Stack
        alignItems="center"
        direction="row"
        spacing={2}
      >
        <CircularProgress size={24} />
        <Typography color="text.secondary">
          Preparing your session...
        </Typography>
      </Stack>
    </AuthPageTemplate>
  );
}
