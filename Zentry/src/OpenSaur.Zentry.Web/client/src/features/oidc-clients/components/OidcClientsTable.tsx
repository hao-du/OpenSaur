import { Alert, Button, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import type { OidcClientSummaryDto } from "../dtos/OidcClientSummaryDto";
import { layoutStyles } from "../../../infrastructure/theme/theme";

type OidcClientsTableProps = {
  actionErrorMessage?: string | null;
  clients: OidcClientSummaryDto[];
  isDeletingClientId: string | null;
  isError: boolean;
  isLoading: boolean;
  onDeleteClient: (oidcClientId: string, displayName: string) => void;
  onEditClient: (oidcClientId: string) => void;
  onRetry: () => void;
};

export function OidcClientsTable({
  actionErrorMessage,
  clients,
  isDeletingClientId,
  isError,
  isLoading,
  onDeleteClient,
  onEditClient,
  onRetry
}: OidcClientsTableProps) {
  if (isLoading) {
    return (
      <Paper elevation={0} sx={layoutStyles.loadingPanel}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">Loading applications...</Typography>
        </Stack>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Alert
        action={(
          <Button color="inherit" onClick={onRetry} size="small">
            Retry
          </Button>
        )}
        severity="error"
      >
        Unable to load OIDC clients.
      </Alert>
    );
  }

  if (clients.length === 0) {
    return (
      <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
        <Stack spacing={1.5}>
          <Typography variant="h6">No applications yet</Typography>
          <Typography color="text.secondary">
            Create a managed OIDC client to register redirect URIs, scopes, and logout paths from Zentry.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      {actionErrorMessage ? <Alert severity="error">{actionErrorMessage}</Alert> : null}
      <Paper elevation={0} sx={layoutStyles.borderedPanelScrollable}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Display name</TableCell>
              <TableCell>Client ID</TableCell>
              <TableCell>Redirect URIs</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map(client => (
              <TableRow hover key={client.id}>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{client.displayName}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {client.clientType}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{client.clientId}</TableCell>
                <TableCell>{client.redirectUris.length}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button
                      onClick={() => {
                        onEditClient(client.id);
                      }}
                      size="small"
                      variant="text"
                    >
                      Edit
                    </Button>
                    <Button
                      color="error"
                      disabled={isDeletingClientId === client.id}
                      onClick={() => {
                        onDeleteClient(client.id, client.displayName);
                      }}
                      size="small"
                      variant="text"
                    >
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
