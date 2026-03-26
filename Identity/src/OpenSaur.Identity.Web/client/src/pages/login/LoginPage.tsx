import { Stack, Typography } from "@mui/material";
import { AuthPageTemplate } from "../../components/templates";

export function LoginPage() {
  return (
    <AuthPageTemplate
      description="Sign in to continue through the first-party identity shell."
      eyebrow="Auth Shell"
      title="Sign in"
    >
      <Stack spacing={1}>
        <Typography color="text.secondary">
          The login form and redirect flow will be added in the next auth slice.
        </Typography>
      </Stack>
    </AuthPageTemplate>
  );
}
