import { Alert, Box, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { BodyText } from "../../../components/atoms/BodyText";
import { LabelText } from "../../../components/atoms/LabelText";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { MetaText } from "../../../components/atoms/MetaText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import type { UserSummaryDto } from "../dtos/UserSummaryDto";
import { useSettings } from "../../settings/provider/SettingProvider";

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
  const { t } = useSettings();

  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 4 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <BodyText>{t("users.loadingUsers")}</BodyText>
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
        {t("users.unableToLoad")}
      </Alert>
    );
  }

  if (users.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: "1px dashed rgba(11,110,79,0.24)", p: 4 }}>
        <Stack spacing={1}>
          <PageTitleText variant="h6">{t("users.noUsersTitle")}</PageTitleText>
          <BodyText>
            {t("users.noUsersBody")}
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
              <TableCell>{t("users.user")}</TableCell>
              <TableCell>{t("common.email")}</TableCell>
              <TableCell>{t("users.roles")}</TableCell>
              <TableCell>{t("common.status")}</TableCell>
              <TableCell>{t("users.password")}</TableCell>
              <TableCell align="right">{t("common.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow hover key={user.id}>
                <TableCell>
                  <Stack spacing={0.25}>
                    <LabelText>{user.userName}</LabelText>
                    <MetaText>
                      {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.description}
                    </MetaText>
                  </Stack>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {user.roleNames.length === 0 ? (
                      <MetaText>{t("users.noRoles")}</MetaText>
                    ) : user.roleNames.map(roleName => (
                      <Chip key={roleName} label={roleName} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    color={user.isActive ? "success" : "default"}
                    label={user.isActive ? t("common.active") : t("common.inactive")}
                    size="small"
                    variant={user.isActive ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    color={user.requirePasswordChange ? "warning" : "default"}
                    label={user.requirePasswordChange ? t("users.changeRequired") : t("users.current")}
                    size="small"
                    variant={user.requirePasswordChange ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <LinkButton
                      onClick={() => {
                        onAssignRoles(user.id);
                      }}
                    >
                      {t("action.assignRoles")}
                    </LinkButton>
                    <LinkButton
                      onClick={() => {
                        onResetPassword(user.id, user.userName);
                      }}
                    >
                      {t("action.resetPassword")}
                    </LinkButton>
                    <LinkButton
                      onClick={() => {
                        onEditUser(user.id);
                      }}
                    >
                      {t("action.edit")}
                    </LinkButton>
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
