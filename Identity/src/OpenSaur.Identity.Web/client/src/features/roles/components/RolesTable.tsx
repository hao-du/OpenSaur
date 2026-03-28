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
import { isSuperAdministrator } from "../../../app/router/protectedShellRoutes";
import type { RoleSummary } from "../types";

type RolesTableProps = {
  canEditDefinitions: boolean;
  isError: boolean;
  isLoading: boolean;
  onEditRole: (roleId: string) => void;
  onRetry?: () => void;
  roles: RoleSummary[];
};

export function RolesTable({
  canEditDefinitions,
  isError,
  isLoading,
  onEditRole,
  onRetry,
  roles
}: RolesTableProps) {
  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          border: "1px solid rgba(11,110,79,0.12)",
          p: 4
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">
            Loading roles...
          </Typography>
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
        We couldn't load the role list right now.
      </Alert>
    );
  }

  if (roles.length === 0) {
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
            No roles yet
          </Typography>
          <Typography color="text.secondary">
            Create the first role to define permissions for managed users.
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
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              {canEditDefinitions ? <TableCell align="right">Actions</TableCell> : null}
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
                {canEditDefinitions ? (
                  <TableCell align="right">
                    {isSuperAdministrator([role.normalizedName]) ? null : (
                      <Button
                        aria-label="Edit role"
                        onClick={() => {
                          onEditRole(role.id);
                        }}
                        size="small"
                        variant="outlined"
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
