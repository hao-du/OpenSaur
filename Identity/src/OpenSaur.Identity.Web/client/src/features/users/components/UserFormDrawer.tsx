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
import { UserForm } from "./UserForm";
import type {
  RoleCandidateSummary,
  UserAssignmentSummary,
  UserDetails
} from "../types";

type UserFormDrawerProps = {
  errorMessage: string | null;
  initialValues?: UserDetails | null;
  isEditMode: boolean;
  isLoading: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: {
    description: string;
    email: string;
    isActive: boolean;
    password: string;
    selectedRoleIds: string[];
    userName: string;
  }) => Promise<void>;
  roleCandidates: RoleCandidateSummary[];
  userAssignments: UserAssignmentSummary[];
};

export function UserFormDrawer({
  errorMessage,
  initialValues,
  isEditMode,
  isLoading,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  roleCandidates,
  userAssignments
}: UserFormDrawerProps) {
  const title = isEditMode ? "Edit user" : "Create user";

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
          <IconButton aria-label="Close user form" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Divider />
        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ flex: 1 }}>
            <CircularProgress size={28} />
            <Typography color="text.secondary">
              Loading user...
            </Typography>
          </Stack>
        ) : (
          <Box sx={{ flex: 1 }}>
            <UserForm
              errorMessage={errorMessage}
              initialValues={{
                description: initialValues?.description ?? "",
                email: initialValues?.email ?? "",
                isActive: initialValues?.isActive ?? true,
                password: "",
                selectedRoleIds: userAssignments
                  .filter(assignment => assignment.isActive)
                  .map(assignment => assignment.roleId),
                userName: initialValues?.userName ?? ""
              }}
              isEditMode={isEditMode}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              roleCandidates={roleCandidates}
            />
          </Box>
        )}
      </Stack>
    </Drawer>
  );
}
