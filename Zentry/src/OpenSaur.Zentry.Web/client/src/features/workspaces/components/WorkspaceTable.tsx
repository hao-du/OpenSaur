import { Alert, Button, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import type { AssignableWorkspaceRoleDto } from "../dtos/AssignableWorkspaceRoleDto";
import type { WorkspaceSummaryDto } from "../dtos/WorkspaceSummaryDto";
import { layoutStyles } from "../../../infrastructure/theme/theme";

type WorkspaceTableProps = {
  availableRoles: AssignableWorkspaceRoleDto[];
  impersonatingWorkspaceId: string | null;
  isError: boolean;
  isImpersonating: boolean;
  isLoading: boolean;
  onEditWorkspace: (workspaceId: string) => void;
  onImpersonateWorkspace: (workspaceId: string) => void;
  onRetry: () => void;
  workspaces: WorkspaceSummaryDto[];
};

export function WorkspaceTable({
  availableRoles,
  impersonatingWorkspaceId,
  isError,
  isImpersonating,
  isLoading,
  onEditWorkspace,
  onImpersonateWorkspace,
  onRetry,
  workspaces
}: WorkspaceTableProps) {
  const roleNamesById = Object.fromEntries(availableRoles.map(role => [role.id, role.name]));

  if (isLoading) {
    return (
      <Paper elevation={0} sx={layoutStyles.loadingPanel}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">Loading workspaces...</Typography>
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
        Unable to load workspaces.
      </Alert>
    );
  }

  if (workspaces.length === 0) {
    return (
      <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
        <Stack spacing={1.5}>
          <Typography variant="h6">No workspaces yet</Typography>
          <Typography color="text.secondary">
            Create a workspace to control role availability and workspace-specific user access in Zentry.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={layoutStyles.borderedPanelScrollable}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Assigned roles</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Max active users</TableCell>
            <TableCell align="right">Actions</TableCell>
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
                <TableCell>{workspace.description || "—"}</TableCell>
                <TableCell>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {assignedRoleNames.length === 0 ? (
                      <Typography color="text.secondary" variant="body2">
                        No roles assigned
                      </Typography>
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
                    label={workspace.isActive ? "Active" : "Inactive"}
                    size="small"
                    variant={workspace.isActive ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell>{workspace.maxActiveUsers ?? "Unlimited"}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button
                      disabled={!workspace.isActive || isImpersonating}
                      onClick={() => {
                        onImpersonateWorkspace(workspace.id);
                      }}
                      size="small"
                      variant="text"
                    >
                      {isImpersonating && impersonatingWorkspaceId === workspace.id ? "Impersonating..." : "Impersonate"}
                    </Button>
                    <Button
                      onClick={() => {
                        onEditWorkspace(workspace.id);
                      }}
                      size="small"
                      variant="text"
                    >
                      Edit
                    </Button>
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
