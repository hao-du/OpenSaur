import { Stack, Typography } from "@mui/material";
import { AuthPageTemplate } from "../../components/templates";

export function ChangePasswordPage() {
  return (
    <AuthPageTemplate
      description="Password rotation will be handled here when the backend requires it."
      eyebrow="Security"
      title="Change password"
    >
      <Stack spacing={1}>
        <Typography color="text.secondary">
          This page is scaffolded and ready for the auth flow implementation.
        </Typography>
      </Stack>
    </AuthPageTemplate>
  );
}
