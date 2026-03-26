import { Button, Paper, Stack, Typography } from "@mui/material";
import { ProtectedShellTemplate } from "../../components/templates";

export function HomePage() {
  return (
    <ProtectedShellTemplate
      actions={<Button variant="outlined">Logout</Button>}
      subtitle="This protected shell is the responsive landing point for the auth-only phase."
      title="Identity shell"
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid rgba(31,60,136,0.12)",
          p: { xs: 3, md: 4 }
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="h5">Frontend foundation ready</Typography>
          <Typography color="text.secondary">
            The next tasks will attach real auth state, callback completion, and
            refresh handling to this shell.
          </Typography>
        </Stack>
      </Paper>
    </ProtectedShellTemplate>
  );
}
