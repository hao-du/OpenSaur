import {
  Alert,
  Box,
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
import { RolePreviewList } from "../../../components/molecules";
import type { WorkspaceSummary } from "../types";
import { usePreferences } from "../../preferences/PreferenceProvider";

type WorkspaceTableProps = {
  isError: boolean;
  isLoading: boolean;
  onEditWorkspace: (workspaceId: string) => void;
  onLoginAsWorkspace: (workspaceId: string) => void;
  onRetry?: () => void;
  roleNamesById: Record<string, string>;
  workspaces: WorkspaceSummary[];
};

export function WorkspaceTable({
  isError,
  isLoading,
  onEditWorkspace,
  onLoginAsWorkspace,
  onRetry,
  roleNamesById,
  workspaces
}: WorkspaceTableProps) {
  const { t } = usePreferences();

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          border: "1px solid rgba(11,110,79,0.12)",
          p: 4
        }}
      >
        <Stack
          alignItems="center"
          spacing={2}
        >
          <CircularProgress size={28} />
          <Typography color="text.secondary">
            {t("workspaces.loading")}
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Alert
        action={onRetry ? (
          <Button
            color="inherit"
            onClick={onRetry}
            size="small"
          >
            {t("common.retry")}
          </Button>
        ) : undefined}
        severity="error"
      >
        {t("workspaces.listError")}
      </Alert>
    );
  }

  if (workspaces.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          border: "1px dashed rgba(11,110,79,0.24)",
          p: 4
        }}
      >
        <Stack spacing={1}>
          <Typography variant="h6">
            {t("workspaces.empty.title")}
          </Typography>
          <Typography color="text.secondary">
            {t("workspaces.empty.description")}
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid rgba(11,110,79,0.12)",
        overflow: "hidden"
      }}
    >
      <Box sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("workspaces.table.name")}</TableCell>
              <TableCell>{t("workspaces.table.description")}</TableCell>
              <TableCell>{t("workspaces.table.roles")}</TableCell>
              <TableCell>{t("workspaces.table.status")}</TableCell>
              <TableCell align="right">{t("workspaces.table.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workspaces.map(workspace => (
              <TableRow
                hover
                key={workspace.id}
              >
                <TableCell>{workspace.name}</TableCell>
                <TableCell>{workspace.description}</TableCell>
                <TableCell>
                  <RolePreviewList
                    emptyLabel={t("workspaces.noRoles")}
                    roles={workspace.assignedRoleIds
                      .map(roleId => ({
                        id: roleId,
                        name: roleNamesById[roleId]
                      }))
                      .filter(
                        (role): role is { id: string; name: string; } => Boolean(role.name)
                      )}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    color={workspace.isActive ? "success" : "default"}
                    label={workspace.isActive ? t("common.active") : t("common.inactive")}
                    size="small"
                    variant={workspace.isActive ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    spacing={1}
                  >
                    <Button
                      aria-label={t("workspaces.table.editAria")}
                      onClick={() => {
                        onEditWorkspace(workspace.id);
                      }}
                      size="small"
                      variant="outlined"
                    >
                      {t("workspaces.table.edit")}
                    </Button>
                    <Button
                      onClick={() => {
                        onLoginAsWorkspace(workspace.id);
                      }}
                      size="small"
                      variant="text"
                    >
                      {t("workspaces.loginAs")}
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
