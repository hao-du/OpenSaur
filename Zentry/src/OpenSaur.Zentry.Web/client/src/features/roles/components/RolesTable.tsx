import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import type { RoleSummaryDto } from "../dtos/RoleSummaryDto";

const normalizedSuperAdministrator = "SUPER ADMINISTRATOR";

type RolesTableProps = {
  canAssignUsers: boolean;
  canEditRoles: boolean;
  isError: boolean;
  isLoading: boolean;
  onAssignUsers: (roleId: string) => void;
  onEditRole: (roleId: string) => void;
  onRetry?: () => void;
  roles: RoleSummaryDto[];
};

export function RolesTable({
  canAssignUsers,
  canEditRoles,
  isError,
  isLoading,
  onAssignUsers,
  onEditRole,
  onRetry,
  roles
}: RolesTableProps) {
  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 4 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">Loading roles...</Typography>
        </Stack>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Alert
        action={onRetry ? (
          <Button color="inherit" onClick={onRetry} size="small">
            Retry
          </Button>
        ) : undefined}
        severity="error"
      >
        Unable to load roles.
      </Alert>
    );
  }

  if (roles.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: "1px dashed rgba(11,110,79,0.24)", p: 4 }}>
        <Stack spacing={1}>
          <Typography variant="h6">No roles found</Typography>
          <Typography color="text.secondary">
            Create a role to start assigning permissions and making it available to workspaces.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", overflow: "hidden" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map(role => (
              <TableRow hover key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <Chip
                    color={role.isActive ? "success" : "default"}
                    label={role.isActive ? "Active" : "Inactive"}
                    size="small"
                    variant={role.isActive ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="right">
                  {canAssignUsers ? (
                    <Button
                      onClick={() => {
                        onAssignUsers(role.id);
                      }}
                      size="small"
                      sx={{ mr: canEditRoles ? 1 : 0 }}
                      variant="outlined"
                    >
                      Assign Users
                    </Button>
                  ) : null}
                  {canEditRoles && role.normalizedName !== normalizedSuperAdministrator ? (
                    <Button
                      onClick={() => {
                        onEditRole(role.id);
                      }}
                      size="small"
                      variant="outlined"
                    >
                      Edit
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
