import { Alert, Box, CircularProgress, Stack } from "@mui/material";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { BodyText } from "../../../components/atoms/BodyText";
import { MultiSelect } from "../../../components/atoms/MultiSelect";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import type { UserRolesDto } from "../dtos/UserRolesDto";
import { useSettings } from "../../settings/provider/SettingProvider";

type AssignUserRolesDrawerProps = {
  errorMessage: string | null;
  isLoading: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (roleIds: string[]) => Promise<void>;
  userRoles?: UserRolesDto | null;
};

type AssignUserRolesFormValues = {
  roleIds: string[];
};

export function AssignUserRolesDrawer({
  errorMessage,
  isLoading,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  userRoles
}: AssignUserRolesDrawerProps) {
  const { t } = useSettings();
  const roles = useMemo(() => userRoles?.roles ?? [], [userRoles?.roles]);
  const roleOptions = useMemo(() => roles.map(role => ({
    description: role.description,
    label: role.name,
    value: role.roleId
  })), [roles]);
  const { control, handleSubmit, reset } = useForm<AssignUserRolesFormValues>({
    defaultValues: {
      roleIds: []
    }
  });

  useEffect(() => {
    if (!isOpen || userRoles == null) {
      return;
    }

    reset({
      roleIds: userRoles.roles
        .filter(role => role.isAssigned)
        .map(role => role.roleId)
    });
  }, [isOpen, reset, userRoles]);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} subtitle={userRoles?.userName ?? ""} title={t("users.assignTitle")}>
        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={layoutStyles.drawerLoadingState}>
            <CircularProgress size={28} />
            <BodyText>{t("users.loadingRoles")}</BodyText>
          </Stack>
        ) : (
          <Stack spacing={3} sx={layoutStyles.drawerBody}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            <MultiSelect
              control={control}
              helperText={roles.length === 0 ? t("users.noAssignableRoles") : undefined}
              label={t("users.roles")}
              name="roleIds"
              options={roleOptions}
              placeholder={t("users.searchRoles")}
            />
            <Box sx={layoutStyles.flexGrow} />
            <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
              <ActionButton onClick={onClose} variant="text">
                {t("action.cancel")}
              </ActionButton>
              <ActionButton
                aria-busy={isSubmitting}
                disabled={isSubmitting}
                onClick={handleSubmit(values => onSubmit(values.roleIds))}
              >
                {isSubmitting ? t("action.saving") : t("action.save")}
              </ActionButton>
            </Stack>
          </Stack>
        )}
    </DrawerPanel>
  );
}
