import { Alert, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { BodyText } from "../../../components/atoms/BodyText";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { MetaText } from "../../../components/atoms/MetaText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import type { AssignableWorkspaceRoleDto } from "../dtos/AssignableWorkspaceRoleDto";
import type { WorkspaceSummaryDto } from "../dtos/WorkspaceSummaryDto";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";

type WorkspaceTableProps = {
  availableRoles: AssignableWorkspaceRoleDto[];
  isError: boolean;
  isLoading: boolean;
  onEditWorkspace: (workspaceId: string) => void;
  onImpersonateWorkspace: (workspaceId: string) => void;
  onRetry: () => void;
  workspaces: WorkspaceSummaryDto[];
};

export function WorkspaceTable({
  availableRoles,
  isError,
  isLoading,
  onEditWorkspace,
  onImpersonateWorkspace,
  onRetry,
  workspaces
}: WorkspaceTableProps) {
  const { t } = useSettings();
  const roleNamesById = Object.fromEntries(availableRoles.map(role => [role.id, role.name]));

  if (isLoading) {
    return (
      <Paper elevation={0} sx={layoutStyles.loadingPanel}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <BodyText>{t("workspaces.loadingWorkspaces")}</BodyText>
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
        {t("workspaces.unableToLoad")}
      </Alert>
    );
  }

  if (workspaces.length === 0) {
    return (
      <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
        <Stack spacing={1.5}>
          <PageTitleText variant="h6">{t("workspaces.noWorkspacesTitle")}</PageTitleText>
          <BodyText>
            {t("workspaces.noWorkspacesBody")}
          </BodyText>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={layoutStyles.borderedPanelScrollable}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("common.name")}</TableCell>
            <TableCell>{t("common.description")}</TableCell>
            <TableCell>{t("workspaces.assignedRoles")}</TableCell>
            <TableCell>{t("common.status")}</TableCell>
            <TableCell>{t("workspaces.maxActiveUsers")}</TableCell>
            <TableCell align="right">{t("common.actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {workspaces.map(workspace => {
            const assignedRoleNames = workspace.assignedRoleIds
              .map(roleId => roleNamesById[roleId])
              .filter((roleName): roleName is string => roleName != null);

            return (
              <TableRow hover key={workspace.id}>
                <TableCell>{workspace.name}</TableCell>
                <TableCell>{workspace.description || "-"}</TableCell>
                <TableCell>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {assignedRoleNames.length === 0 ? (
                      <MetaText>
                        {t("workspaces.noRolesAssigned")}
                      </MetaText>
                    ) : (
                      assignedRoleNames.map(roleName => (
                        <Chip key={`${workspace.id}-${roleName}`} label={roleName} size="small" variant="outlined" />
                      ))
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    color={workspace.isActive ? "success" : "default"}
                    label={workspace.isActive ? t("common.active") : t("common.inactive")}
                    size="small"
                    variant={workspace.isActive ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell>{workspace.maxActiveUsers ?? t("common.unlimited")}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <LinkButton
                      onClick={() => {
                        onEditWorkspace(workspace.id);
                      }}
                    >
                      {t("action.edit")}
                    </LinkButton>
                    <LinkButton
                      onClick={() => {
                        onImpersonateWorkspace(workspace.id);
                      }}
                    >
                      {t("action.impersonate")}
                    </LinkButton>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}
