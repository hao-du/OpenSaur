import { Alert, Button, Stack, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import { Card } from "../components/molecules/Card";
import { PageLayout } from "../components/templates/PageLayout";

type ForbiddenPageState = {
  title?: string;
  subtitle?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  error?: string | null;
};

export function ForbiddenPage() {
  const location = useLocation();
  const state = (location.state as ForbiddenPageState | null) ?? null;

  const title = state?.title ?? "Forbidden";
  const subtitle = state?.subtitle ?? "You do not have access to this page.";
  const message = state?.message ?? "Return to the normal sign-in flow or continue where you left off.";
  const actionLabel = state?.actionLabel ?? "Continue";
  const actionHref = state?.actionHref ?? "/";
  const error = state?.error ?? null;

  return (
    <PageLayout background="auth">
      <Card title={title} subtitle={subtitle}>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Typography color="text.secondary">{message}</Typography>
          <Button variant="contained" onClick={() => window.location.assign(actionHref)}>
            {actionLabel}
          </Button>
        </Stack>
      </Card>
    </PageLayout>
  );
}
