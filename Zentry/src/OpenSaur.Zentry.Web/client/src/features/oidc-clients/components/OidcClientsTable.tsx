import { Alert, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { BodyText } from "../../../components/atoms/BodyText";
import { LabelText } from "../../../components/atoms/LabelText";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { MetaText } from "../../../components/atoms/MetaText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import type { OidcClientSummaryDto } from "../dtos/OidcClientSummaryDto";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";

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
  const { t } = useSettings();

  if (isLoading) {
    return (
      <Paper elevation={0} sx={layoutStyles.loadingPanel}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <BodyText>{t("oidc.loadingApplications")}</BodyText>
        </Stack>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Alert
        action={(
          <ActionButton color="inherit" onClick={onRetry} size="small" variant="text">
            {t("action.retry")}
          </ActionButton>
        )}
        severity="error"
      >
        {t("oidc.unableToLoad")}
      </Alert>
    );
  }

  if (clients.length === 0) {
    return (
      <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
        <Stack spacing={1.5}>
          <PageTitleText variant="h6">{t("oidc.noApplicationsTitle")}</PageTitleText>
          <BodyText>
            {t("oidc.noApplicationsBody")}
          </BodyText>
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
              <TableCell>{t("oidc.displayName")}</TableCell>
              <TableCell>{t("auth.clientId")}</TableCell>
              <TableCell>{t("oidc.redirectUris")}</TableCell>
              <TableCell align="right">{t("common.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map(client => (
              <TableRow hover key={client.id}>
                <TableCell>
                  <Stack spacing={0.5}>
                    <LabelText>{client.displayName}</LabelText>
                    <MetaText>
                      {client.clientType}
                    </MetaText>
                  </Stack>
                </TableCell>
                <TableCell>{client.clientId}</TableCell>
                <TableCell>{client.redirectUris.length}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <LinkButton
                      onClick={() => {
                        onEditClient(client.id);
                      }}
                    >
                      {t("action.edit")}
                    </LinkButton>
                    <LinkButton
                      color="error"
                      disabled={isDeletingClientId === client.id}
                      onClick={() => {
                        onDeleteClient(client.id, client.displayName);
                      }}
                    >
                      {t("action.delete")}
                    </LinkButton>
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
