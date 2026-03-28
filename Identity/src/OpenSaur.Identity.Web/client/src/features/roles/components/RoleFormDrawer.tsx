import {
  Box,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography
} from "@mui/material";
import { X } from "../../../shared/icons";
import { RoleForm } from "./RoleForm";
import type { PermissionSummary, RoleDetails } from "../types";

type RoleFormDrawerProps = {
  errorMessage: string | null;
  initialValues?: RoleDetails | null;
  isEditMode: boolean;
  isLoading: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: {
    description: string;
    isActive: boolean;
    name: string;
    permissionCodeIds: number[];
  }) => Promise<void>;
  permissions: PermissionSummary[];
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
  const title = isEditMode ? "Edit role" : "Create role";

  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={isOpen}
      sx={{
        "& .MuiDrawer-paper": {
          p: 3,
          width: { sm: 560, xs: "100%" }
        }
      }}
    >
      <Stack spacing={3} sx={{ height: "100%" }}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Typography component="h2" variant="h5">
            {title}
          </Typography>
          <IconButton aria-label="Close role form" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Divider />
        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ flex: 1 }}>
            <CircularProgress size={28} />
            <Typography color="text.secondary">
              Loading role...
            </Typography>
          </Stack>
        ) : (
          <Box sx={{ flex: 1 }}>
            <RoleForm
              errorMessage={errorMessage}
              initialValues={{
                description: initialValues?.description ?? "",
                isActive: initialValues?.isActive ?? true,
                name: initialValues?.name ?? "",
                permissionCodeIds: initialValues?.permissionCodeIds ?? []
              }}
              isEditMode={isEditMode}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              permissions={permissions}
            />
          </Box>
        )}
      </Stack>
    </Drawer>
  );
}
