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
import { usePreferences } from "../../preferences/PreferenceProvider";

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
  const { t } = usePreferences();

  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 4 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">
            {t("roleAssignments.loading")}
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
            {t("common.retry")}
          </Button>
        ) : undefined}
        severity="error"
      >
        {t("roleAssignments.retryLoad")}
      </Alert>
    );
  }

  if (roles.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: "1px dashed rgba(11,110,79,0.24)", p: 4 }}>
        <Stack spacing={1}>
          <Typography variant="h6">
            {t("roleAssignments.empty.title")}
          </Typography>
          <Typography color="text.secondary">
            {t("roleAssignments.empty.description")}
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
              <TableCell>{t("roleAssignments.table.name")}</TableCell>
              <TableCell>{t("roleAssignments.table.description")}</TableCell>
              <TableCell>{t("roleAssignments.table.status")}</TableCell>
              <TableCell align="right">{t("roleAssignments.table.actions")}</TableCell>
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
                    label={role.isActive ? t("common.active") : t("common.inactive")}
                    size="small"
                    variant={role.isActive ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    aria-label={t("roleAssignments.table.editAssignments")}
                    onClick={() => {
                      onEditAssignments(role.id);
                    }}
                    size="small"
                    variant="outlined"
                  >
                    {t("roleAssignments.table.edit")}
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
