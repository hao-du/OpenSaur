import { Grid, Stack, Typography } from "@mui/material";
import { useAuth } from "../auth/useAuth";
import { PageIntro } from "../components/layout/PageIntro";
import { PageSectionCard } from "../components/layout/PageSectionCard";
import { ProtectedShellTemplate } from "../components/shell/ProtectedShellTemplate";

export function DashboardPage() {
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  const { profile, tokenSet } = session;

  return (
    <ProtectedShellTemplate
      subtitle="This phase proves the full browser flow: redirect, callback, code exchange, token storage, and authenticated identity bootstrap."
      title="Dashboard"
    >
      <PageIntro
        subtitle="Your Zentry session is authenticated through CoreGate."
        title="Workspace overview"
      />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PageSectionCard>
            <Stack spacing={1.5}>
              <Typography variant="h6">Identity</Typography>
              <InfoRow label="Subject" value={profile.subject} />
              <InfoRow label="Username" value={profile.preferredUsername ?? "Not provided"} />
              <InfoRow label="Email" value={profile.email ?? "Not provided"} />
              <InfoRow label="Workspace" value={profile.workspaceId ?? "Not provided"} />
              <InfoRow label="Roles" value={profile.roles?.join(", ") ?? "Not provided"} />
            </Stack>
          </PageSectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PageSectionCard>
            <Stack spacing={1.5}>
              <Typography variant="h6">Token snapshot</Typography>
              <InfoRow label="Token type" value={tokenSet.tokenType} />
              <InfoRow label="Expires at" value={tokenSet.expiresAtUtc} />
              <InfoRow label="Scope" value={tokenSet.scope ?? "Not provided"} />
              <InfoRow label="ID token" value={tokenSet.idToken ? "Issued" : "Not issued"} />
            </Stack>
          </PageSectionCard>
        </Grid>
      </Grid>
    </ProtectedShellTemplate>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <Typography color="text.secondary">{`${label}: ${value}`}</Typography>;
}
