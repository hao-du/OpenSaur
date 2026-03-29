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
import type { UserSummary } from "../types";

type UsersTableProps = {
  isError: boolean;
  isLoading: boolean;
  onEditUser: (userId: string) => void;
  onRetry?: () => void;
  users: UserSummary[];
};

export function UsersTable({
  isError,
  isLoading,
  onEditUser,
  onRetry,
  users
}: UsersTableProps) {
  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 4 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">
            Loading users...
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
        We couldn't load the user list right now.
      </Alert>
    );
  }

  if (users.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: "1px dashed rgba(11,110,79,0.24)", p: 4 }}>
        <Stack spacing={1}>
          <Typography variant="h6">
            No users yet
          </Typography>
          <Typography color="text.secondary">
            Create the first user for the current workspace.
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
              <TableCell>User name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow hover key={user.id}>
                <TableCell>{user.userName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <RolePreviewList
                    emptyLabel="No roles"
                    roles={(user.roles ?? []).map(role => ({
                      id: role.id,
                      name: role.name
                    }))}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    color={user.isActive ? "success" : "default"}
                    label={user.isActive ? "Active" : "Inactive"}
                    size="small"
                    variant={user.isActive ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    aria-label="Edit user"
                    onClick={() => {
                      onEditUser(user.id);
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
