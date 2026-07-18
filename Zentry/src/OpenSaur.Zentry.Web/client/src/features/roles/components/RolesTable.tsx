import { Alert, Box, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { BodyText } from "../../../components/atoms/BodyText";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import type { RoleSummaryDto } from "../dtos/RoleSummaryDto";
import { useSettings } from "../../settings/provider/SettingProvider";

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
  const { t } = useSettings();

  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 4 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <BodyText>{t("roles.loadingRoles")}</BodyText>
        </Stack>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Alert
        action={onRetry ? (
          <ActionButton color="inherit" onClick={onRetry} size="small" variant="text">
            {t("action.retry")}
          </ActionButton>
        ) : undefined}
        severity="error"
      >
        {t("roles.unableToLoad")}
      </Alert>
    );
  }

  if (roles.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: "1px dashed rgba(11,110,79,0.24)", p: 4 }}>
        <Stack spacing={1}>
          <PageTitleText variant="h6">{t("roles.noRolesTitle")}</PageTitleText>
          <BodyText>
            {t("roles.noRolesBody")}
          </BodyText>
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
              <TableCell>{t("common.name")}</TableCell>
              <TableCell>{t("common.description")}</TableCell>
              <TableCell>{t("common.status")}</TableCell>
              <TableCell align="right">{t("common.actions")}</TableCell>
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
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    {canAssignUsers ? (
                      <LinkButton
                        onClick={() => {
                          onAssignUsers(role.id);
                        }}
                      >
                        {t("action.assignUsers")}
                      </LinkButton>
                    ) : null}
                    {canEditRoles && role.normalizedName !== normalizedSuperAdministrator ? (
                      <LinkButton
                        onClick={() => {
                          onEditRole(role.id);
                        }}
                      >
                        {t("action.edit")}
                      </LinkButton>
                    ) : null}
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
