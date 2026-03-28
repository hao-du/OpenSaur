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
import type { RoleSummary } from "../../roles/types";

type RoleAssignmentsTableProps = {
  isError: boolean;
  isLoading: boolean;
  onEditAssignments: (roleId: string) => void;
  onRetry?: () => void;
  roles: RoleSummary[];
};

export function RoleAssignmentsTable({
  isError,
  isLoading,
  onEditAssignments,
  onRetry,
  roles
}: RoleAssignmentsTableProps) {
  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 4 }}>
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
        We couldn't load the role assignments right now.
      </Alert>
    );
  }

  if (roles.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: "1px dashed rgba(11,110,79,0.24)", p: 4 }}>
        <Stack spacing={1}>
          <Typography variant="h6">
            No roles available
          </Typography>
          <Typography color="text.secondary">
            There are no roles available to assign in the current workspace.
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
                  <Button
                    aria-label="Edit assignments"
                    onClick={() => {
                      onEditAssignments(role.id);
                    }}
                    size="small"
                    variant="outlined"
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
