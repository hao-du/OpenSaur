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
import { usePreferences } from "../../preferences/PreferenceProvider";

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
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">
            {t("roles.loading")}
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
        {t("roles.listError")}
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
            {t("roles.empty.title")}
          </Typography>
          <Typography color="text.secondary">
            {t("roles.empty.description")}
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
              <TableCell>{t("roles.table.name")}</TableCell>
              <TableCell>{t("roles.table.description")}</TableCell>
              <TableCell>{t("roles.table.status")}</TableCell>
              {canEditDefinitions ? <TableCell align="right">{t("roles.table.actions")}</TableCell> : null}
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
                {canEditDefinitions ? (
                  <TableCell align="right">
                    {isSuperAdministrator([role.normalizedName]) ? null : (
                      <Button
                        aria-label={t("roles.table.editAria")}
                        onClick={() => {
                          onEditRole(role.id);
                        }}
                        size="small"
                        variant="outlined"
                      >
                        {t("roles.table.edit")}
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
