import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import type { UserSummaryDto } from "../dtos/UserSummaryDto";

type UsersTableProps = {
  isError: boolean;
  isLoading: boolean;
  onAssignRoles: (userId: string) => void;
  onEditUser: (userId: string) => void;
  onResetPassword: (userId: string, userName: string) => void;
  onRetry?: () => void;
  users: UserSummaryDto[];
};

export function UsersTable({
  isError,
  isLoading,
  onAssignRoles,
  onEditUser,
  onResetPassword,
  onRetry,
  users
}: UsersTableProps) {
  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 4 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">Loading users...</Typography>
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
        Unable to load users.
      </Alert>
    );
  }

  if (users.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: "1px dashed rgba(11,110,79,0.24)", p: 4 }}>
        <Stack spacing={1}>
          <Typography variant="h6">No users found</Typography>
          <Typography color="text.secondary">
            Create a user to grant access inside the current workspace.
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
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Password</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow hover key={user.id}>
                <TableCell>
                  <Stack spacing={0.25}>
                    <Typography>{user.userName}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.description}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {user.roleNames.length === 0 ? (
                      <Typography color="text.secondary" variant="body2">No roles</Typography>
                    ) : user.roleNames.map(roleName => (
                      <Chip key={roleName} label={roleName} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    color={user.isActive ? "success" : "default"}
                    label={user.isActive ? "Active" : "Inactive"}
                    size="small"
                    variant={user.isActive ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    color={user.requirePasswordChange ? "warning" : "default"}
                    label={user.requirePasswordChange ? "Change required" : "Current"}
                    size="small"
                    variant={user.requirePasswordChange ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    onClick={() => {
                      onAssignRoles(user.id);
                    }}
                    size="small"
                    sx={{ mr: 1 }}
                    variant="outlined"
                  >
                    Assign Roles
                  </Button>
                  <Button
                    onClick={() => {
                      onResetPassword(user.id, user.userName);
                    }}
                    size="small"
                    sx={{ mr: 1 }}
                    variant="outlined"
                  >
                    Reset Password
                  </Button>
                  <Button
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
