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
import { usePreferences } from "../../preferences/PreferenceProvider";

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
  const { t } = usePreferences();

  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 4 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">
            {t("users.loading")}
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
        {t("users.listError")}
      </Alert>
    );
  }

  if (users.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: "1px dashed rgba(11,110,79,0.24)", p: 4 }}>
        <Stack spacing={1}>
          <Typography variant="h6">
            {t("users.empty.title")}
          </Typography>
          <Typography color="text.secondary">
            {t("users.empty.description")}
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
              <TableCell>{t("users.table.userName")}</TableCell>
              <TableCell>{t("users.table.email")}</TableCell>
              <TableCell>{t("users.table.roles")}</TableCell>
              <TableCell>{t("users.table.status")}</TableCell>
              <TableCell align="right">{t("users.table.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow hover key={user.id}>
                <TableCell>{user.userName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <RolePreviewList
                    emptyLabel={t("users.noRoles")}
                    roles={(user.roles ?? []).map(role => ({
                      id: role.id,
                      name: role.name
                    }))}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    color={user.isActive ? "success" : "default"}
                    label={user.isActive ? t("common.active") : t("common.inactive")}
                    size="small"
                    variant={user.isActive ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    aria-label={t("users.table.editAria")}
                    onClick={() => {
                      onEditUser(user.id);
                    }}
                    size="small"
                    variant="outlined"
                  >
                    {t("users.table.edit")}
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
