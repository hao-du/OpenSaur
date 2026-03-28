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
import type { WorkspaceSummary } from "../types";

type WorkspaceTableProps = {
  isError: boolean;
  isLoading: boolean;
  onEditWorkspace: (workspaceId: string) => void;
  onLoginAsWorkspace: (workspaceId: string) => void;
  onRetry?: () => void;
  workspaces: WorkspaceSummary[];
};

export function WorkspaceTable({
  isError,
  isLoading,
  onEditWorkspace,
  onLoginAsWorkspace,
  onRetry,
  workspaces
}: WorkspaceTableProps) {
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
            Loading workspaces...
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
            Retry
          </Button>
        ) : undefined}
        severity="error"
      >
        We couldn't load the workspace list right now.
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
            No workspaces yet
          </Typography>
          <Typography color="text.secondary">
            Create the first workspace to start organizing access and administration.
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
              <TableCell align="right">Actions</TableCell>
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
                  <Chip
                    color={workspace.isActive ? "success" : "default"}
                    label={workspace.isActive ? "Active" : "Inactive"}
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
                      aria-label="Edit workspace"
                      onClick={() => {
                        onEditWorkspace(workspace.id);
                      }}
                      size="small"
                      variant="outlined"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        onLoginAsWorkspace(workspace.id);
                      }}
                      size="small"
                      variant="text"
                    >
                      Login as
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
