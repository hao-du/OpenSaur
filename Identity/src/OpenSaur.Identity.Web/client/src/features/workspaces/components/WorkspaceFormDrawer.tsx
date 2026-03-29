import {
  Box,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography
} from "@mui/material";
import { X } from "lucide-react";
import { WorkspaceForm } from "./WorkspaceForm";
import type { WorkspaceDetails } from "../types";
import type { RoleSummary } from "../../roles/types";

type WorkspaceFormDrawerProps = {
  availableRoles: RoleSummary[];
  defaultAssignedRoleIds: string[];
  errorMessage: string | null;
  initialValues?: WorkspaceDetails | null;
  isEditMode: boolean;
  isLoading: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: {
    description: string;
    isActive: boolean;
    maxActiveUsers: string;
    name: string;
    selectedRoleIds: string[];
  }) => Promise<void>;
};

export function WorkspaceFormDrawer({
  availableRoles,
  defaultAssignedRoleIds,
  errorMessage,
  initialValues,
  isEditMode,
  isLoading,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit
}: WorkspaceFormDrawerProps) {
  const title = isEditMode ? "Edit workspace" : "Create workspace";

  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={isOpen}
      sx={{
        "& .MuiDrawer-paper": {
          p: 3,
          width: { sm: 480, xs: "100%" }
        }
      }}
    >
      <Stack
        spacing={3}
        sx={{ height: "100%" }}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Typography
            component="h2"
            variant="h5"
          >
            {title}
          </Typography>
          <IconButton
            aria-label="Close workspace form"
            onClick={onClose}
          >
            <X size={18} />
          </IconButton>
        </Stack>
        <Divider />
        {isLoading ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{ flex: 1 }}
          >
            <CircularProgress size={28} />
            <Typography color="text.secondary">
              Loading workspace...
            </Typography>
          </Stack>
        ) : (
          <Box sx={{ flex: 1 }}>
            <WorkspaceForm
              availableRoles={availableRoles}
              errorMessage={errorMessage}
              initialValues={{
                description: initialValues?.description ?? "",
                isActive: initialValues?.isActive ?? true,
                maxActiveUsers: initialValues?.maxActiveUsers?.toString() ?? "",
                name: initialValues?.name ?? "",
                selectedRoleIds: initialValues?.assignedRoleIds ?? defaultAssignedRoleIds
              }}
              isEditMode={isEditMode}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
            />
          </Box>
        )}
      </Stack>
    </Drawer>
  );
}
