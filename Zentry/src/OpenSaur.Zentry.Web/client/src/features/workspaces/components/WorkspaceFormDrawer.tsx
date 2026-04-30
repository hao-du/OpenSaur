import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect } from "react";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import type { AssignableWorkspaceRoleDto } from "../dtos/AssignableWorkspaceRoleDto";
import type { WorkspaceDetailsDto } from "../dtos/WorkspaceDetailsDto";
import { useCreateWorkspace } from "../hooks/useCreateWorkspace";
import { useEditWorkspace } from "../hooks/useEditWorkspace";
import { WorkspaceForm } from "./WorkspaceForm";

type WorkspaceFormDrawerProps = {
  availableRoles: AssignableWorkspaceRoleDto[];
  initialValues?: WorkspaceDetailsDto | null;
  isEditMode: boolean;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
};

function normalizeMaxActiveUsers(value: string) {
  const normalizedValue = value.trim();
  return normalizedValue.length === 0 ? null : Number(normalizedValue);
}

export function WorkspaceFormDrawer({
  availableRoles,
  initialValues,
  isEditMode,
  isLoading,
  isOpen,
  onClose
}: WorkspaceFormDrawerProps) {
  const { createWorkspace, errorMessage: createErrorMessage, isCreating, resetError: resetCreateError } = useCreateWorkspace();
  const { editWorkspace, errorMessage: editErrorMessage, isEditing, resetError: resetEditError } = useEditWorkspace();
  const errorMessage = isEditMode ? editErrorMessage : createErrorMessage;
  const isSubmitting = isEditMode ? isEditing : isCreating;

  useEffect(() => {
    if (!isOpen) {
      resetCreateError();
      resetEditError();
    }
  }, [isOpen, resetCreateError, resetEditError]);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit workspace" : "Create workspace"}>
        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={layoutStyles.drawerLoadingState}>
            <CircularProgress size={28} />
            <Typography color="text.secondary">Loading workspace...</Typography>
          </Stack>
        ) : (
          <Box sx={layoutStyles.drawerBody}>
            <WorkspaceForm
              availableRoles={availableRoles}
              errorMessage={errorMessage}
              initialValues={{
                description: initialValues?.description ?? "",
                isActive: initialValues?.isActive ?? true,
                maxActiveUsers: initialValues?.maxActiveUsers?.toString() ?? "",
                name: initialValues?.name ?? "",
                selectedRoleIds: initialValues?.assignedRoleIds ?? []
              }}
              isEditMode={isEditMode}
              isSubmitting={isSubmitting}
              onSubmit={async values => {
                if (isEditMode) {
                  if (initialValues == null) {
                    return;
                  }

                  await editWorkspace({
                    assignedRoleIds: values.selectedRoleIds,
                    description: values.description,
                    id: initialValues.id,
                    isActive: values.isActive,
                    maxActiveUsers: normalizeMaxActiveUsers(values.maxActiveUsers),
                    name: values.name
                  });
                  onClose();
                  return;
                }

                await createWorkspace({
                  assignedRoleIds: values.selectedRoleIds,
                  description: values.description,
                  maxActiveUsers: normalizeMaxActiveUsers(values.maxActiveUsers),
                  name: values.name
                });
                onClose();
              }}
            />
          </Box>
        )}
    </DrawerPanel>
  );
}
