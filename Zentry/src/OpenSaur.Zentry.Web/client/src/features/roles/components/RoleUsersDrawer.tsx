import { Alert, Box, CircularProgress, Stack } from "@mui/material";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { BodyText } from "../../../components/atoms/BodyText";
import { MultiSelect } from "../../../components/atoms/MultiSelect";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import type { RoleUsersDto } from "../dtos/RoleUsersDto";
import { useSettings } from "../../settings/provider/SettingProvider";

type RoleUsersDrawerProps = {
  errorMessage: string | null;
  isLoading: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (userIds: string[]) => Promise<void>;
  roleUsers?: RoleUsersDto | null;
};

type RoleUsersFormValues = {
  userIds: string[];
};

function formatUserOptionLabel(firstName: string, lastName: string, userName: string) {
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName.length > 0 ? `${fullName} (${userName})` : userName;
}

export function RoleUsersDrawer({
  errorMessage,
  isLoading,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  roleUsers
}: RoleUsersDrawerProps) {
  const { t } = useSettings();
  const users = useMemo(() => roleUsers?.users ?? [], [roleUsers?.users]);
  const userOptions = useMemo(() => users.map(user => ({
    description: user.email,
    label: formatUserOptionLabel(user.firstName, user.lastName, user.userName),
    value: user.userId
  })), [users]);
  const { control, handleSubmit, reset } = useForm<RoleUsersFormValues>({
    defaultValues: {
      userIds: []
    }
  });

  useEffect(() => {
    if (!isOpen || roleUsers == null) {
      return;
    }

    reset({
      userIds: roleUsers.users
        .filter(user => user.isAssigned)
        .map(user => user.userId)
    });
  }, [isOpen, reset, roleUsers]);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} subtitle={roleUsers?.roleName ?? ""} title={t("action.assignUsers")}>
      {isLoading ? (
        <Stack alignItems="center" justifyContent="center" spacing={2} sx={layoutStyles.drawerLoadingState}>
          <CircularProgress size={28} />
          <BodyText>{t("roles.loadingUsers")}</BodyText>
        </Stack>
      ) : (
        <Stack spacing={3} sx={layoutStyles.drawerBody}>
          {errorMessage ? (
            <Alert severity="error">
              {errorMessage}
            </Alert>
          ) : null}
          <MultiSelect
            control={control}
            helperText={users.length === 0 ? t("roles.noActiveUsers") : undefined}
            label={t("roles.users")}
            name="userIds"
            options={userOptions}
            placeholder={t("roles.searchUsers")}
          />
          <Box sx={layoutStyles.flexGrow} />
          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <ActionButton
              onClick={onClose}
              variant="text"
            >
              {t("action.cancel")}
            </ActionButton>
            <ActionButton
              aria-busy={isSubmitting}
              disabled={isSubmitting}
              onClick={handleSubmit(values => onSubmit(values.userIds))}
            >
              {isSubmitting ? t("action.saving") : t("action.save")}
            </ActionButton>
          </Stack>
        </Stack>
      )}
    </DrawerPanel>
  );
}
