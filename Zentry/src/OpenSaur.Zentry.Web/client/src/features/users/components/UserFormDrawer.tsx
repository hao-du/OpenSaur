import { Box, CircularProgress, Stack } from "@mui/material";
import { useEffect } from "react";
import { BodyText } from "../../../components/atoms/BodyText";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import type { UserDetailsDto } from "../dtos/UserDetailsDto";
import { useCreateUser } from "../hooks/useCreateUser";
import { useEditUser } from "../hooks/useEditUser";
import { useSyncUser } from "../hooks/useSyncUser";
import { UserForm } from "./UserForm";
import { useSettings } from "../../settings/provider/SettingProvider";

type UserFormDrawerProps = {
  initialValues?: UserDetailsDto | null;
  isEditMode: boolean;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
};

export function UserFormDrawer({
  initialValues,
  isEditMode,
  isLoading,
  isOpen,
  onClose
}: UserFormDrawerProps) {
  const { createUser, errorMessage: createErrorMessage, isCreating, resetError: resetCreateError } = useCreateUser();
  const { editUser, errorMessage: editErrorMessage, isEditing, resetError: resetEditError } = useEditUser();
  const { errorMessage: syncErrorMessage, isSuccess: isSyncSuccess, isSyncing, reset: resetSync, syncUser } = useSyncUser();
  const { t } = useSettings();
  const errorMessage = isEditMode ? editErrorMessage : createErrorMessage;
  const isSubmitting = isEditMode ? isEditing : isCreating;

  useEffect(() => {
    if (!isOpen) {
      resetCreateError();
      resetEditError();
      resetSync();
    }
  }, [isOpen, resetCreateError, resetEditError, resetSync]);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title={isEditMode ? t("users.editTitle") : t("users.createTitle")}>
        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={layoutStyles.drawerLoadingState}>
            <CircularProgress size={28} />
            <BodyText>{t("users.loadingUser")}</BodyText>
          </Stack>
        ) : (
          <Box sx={layoutStyles.drawerBody}>
            <UserForm
              errorMessage={errorMessage}
              initialValues={{
                description: initialValues?.description ?? "",
                email: initialValues?.email ?? "",
                firstName: initialValues?.firstName ?? "",
                isActive: initialValues?.isActive ?? true,
                lastName: initialValues?.lastName ?? "",
                password: "",
                requirePasswordChange: initialValues?.requirePasswordChange ?? true,
                userName: initialValues?.userName ?? ""
              }}
              isEditMode={isEditMode}
              isSubmitting={isSubmitting}
              isSyncing={isSyncing}
              onSync={isEditMode && initialValues ? async () => {
                await syncUser(initialValues.id);
              } : undefined}
              syncErrorMessage={syncErrorMessage}
              syncSuccessMessage={isSyncSuccess ? t("users.syncSuccess") : null}
              onSubmit={async values => {
                if (isEditMode) {
                  if (initialValues == null) {
                    return;
                  }

                  await editUser({
                    description: values.description,
                    email: values.email,
                    firstName: values.firstName,
                    id: initialValues.id,
                    isActive: values.isActive,
                    lastName: values.lastName,
                    requirePasswordChange: values.requirePasswordChange,
                    userName: values.userName
                  });
                  onClose();
                  return;
                }

                await createUser({
                  description: values.description,
                  email: values.email,
                  firstName: values.firstName,
                  lastName: values.lastName,
                  password: values.password,
                  requirePasswordChange: values.requirePasswordChange,
                  userName: values.userName
                });
                onClose();
              }}
            />
          </Box>
        )}
    </DrawerPanel>
  );
}
