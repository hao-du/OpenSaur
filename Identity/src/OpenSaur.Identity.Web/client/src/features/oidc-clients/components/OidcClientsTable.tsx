import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import type { OidcClientSummary } from "../types";
import { usePreferences } from "../../preferences/PreferenceProvider";

type OidcClientsTableProps = {
  actionErrorMessage?: string | null;
  clients: OidcClientSummary[];
  isDeletingClientId: string | null;
  isError: boolean;
  isLoading: boolean;
  onDeleteClient: (oidcClientId: string) => void;
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
  const { t } = usePreferences();

  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 4 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">{t("oidcClients.loading")}</Typography>
        </Stack>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Alert
        action={(
          <Button color="inherit" onClick={onRetry} size="small">
            {t("common.retry")}
          </Button>
        )}
        severity="error"
      >
        {t("oidcClients.loadError")}
      </Alert>
    );
  }

  if (clients.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: "1px dashed rgba(11,110,79,0.24)", p: 4 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">{t("oidcClients.empty.title")}</Typography>
          <Typography color="text.secondary">
            {t("oidcClients.empty.description")}
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      {actionErrorMessage ? (
        <Alert severity="error">{actionErrorMessage}</Alert>
      ) : null}
      <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("oidcClients.table.displayName")}</TableCell>
              <TableCell>{t("oidcClients.table.clientId")}</TableCell>
              <TableCell>{t("oidcClients.table.status")}</TableCell>
              <TableCell align="right">{t("oidcClients.table.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map(client => (
              <TableRow hover key={client.id}>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{client.displayName}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {client.description || t("oidcClients.noDescription")}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{client.clientId}</TableCell>
                <TableCell>
                  <Chip
                    color={client.isActive ? "success" : "default"}
                    label={client.isActive ? t("common.active") : t("common.inactive")}
                    size="small"
                    variant={client.isActive ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button
                      onClick={() => {
                        onEditClient(client.id);
                      }}
                      size="small"
                      variant="text"
                    >
                      {t("common.edit")}
                    </Button>
                    {client.isActive ? (
                      <Button
                        color="error"
                        disabled={isDeletingClientId === client.id}
                        onClick={() => {
                          onDeleteClient(client.id);
                        }}
                        size="small"
                        variant="text"
                      >
                        {t("oidcClients.table.deactivate")}
                      </Button>
                    ) : null}
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
