import { Box, CircularProgress, Stack } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import type { PermissionSummaryDto } from "../dtos/PermissionSummaryDto";
import type { RoleDetailsDto } from "../dtos/RoleDetailsDto";
import { RoleForm, type RoleFormValues } from "./RoleForm";
import { useSettings } from "../../settings/provider/SettingProvider";

type RoleFormDrawerProps = {
  errorMessage: string | null;
  initialValues?: RoleDetailsDto | null;
  isEditMode: boolean;
  isLoading: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void>;
  permissions: PermissionSummaryDto[];
};

export function RoleFormDrawer({
  errorMessage,
  initialValues,
  isEditMode,
  isLoading,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  permissions
}: RoleFormDrawerProps) {
  const { t } = useSettings();

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title={isEditMode ? t("roles.editTitle") : t("roles.createTitle")} width="wide">
        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={layoutStyles.drawerLoadingState}>
            <CircularProgress size={28} />
            <BodyText>{t("roles.loadingRole")}</BodyText>
          </Stack>
        ) : (
          <Box sx={layoutStyles.drawerBody}>
            <RoleForm
              errorMessage={errorMessage}
              initialValues={{
                description: initialValues?.description ?? "",
                isActive: initialValues?.isActive ?? true,
                name: initialValues?.name ?? "",
                permissionCodes: initialValues?.permissionCodes ?? []
              }}
              isEditMode={isEditMode}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              permissions={permissions}
            />
          </Box>
        )}
    </DrawerPanel>
  );
}
