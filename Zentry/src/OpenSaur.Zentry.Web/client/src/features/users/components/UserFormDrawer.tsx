import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect } from "react";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import type { UserDetailsDto } from "../dtos/UserDetailsDto";
import { useCreateUser } from "../hooks/useCreateUser";
import { useEditUser } from "../hooks/useEditUser";
import { UserForm } from "./UserForm";

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
  const errorMessage = isEditMode ? editErrorMessage : createErrorMessage;
  const isSubmitting = isEditMode ? isEditing : isCreating;

  useEffect(() => {
    if (!isOpen) {
      resetCreateError();
      resetEditError();
    }
  }, [isOpen, resetCreateError, resetEditError]);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit user" : "Create user"}>
        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={layoutStyles.drawerLoadingState}>
            <CircularProgress size={28} />
            <Typography color="text.secondary">Loading user...</Typography>
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
