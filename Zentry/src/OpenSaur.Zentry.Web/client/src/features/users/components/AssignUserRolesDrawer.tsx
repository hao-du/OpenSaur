import { Alert, Box, Button, CircularProgress, Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { MultiSelect } from "../../../components/atoms/MultiSelect";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import type { UserRolesDto } from "../dtos/UserRolesDto";

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
    <Drawer anchor="right" open={isOpen} sx={layoutStyles.drawerPaperNarrow}>
      <Stack spacing={3} sx={layoutStyles.drawerContent}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography component="h2" variant="h5">
              Assign Roles
            </Typography>
            <Typography color="text.secondary">{userRoles?.userName ?? ""}</Typography>
          </Stack>
          <IconButton aria-label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Divider />
        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={layoutStyles.drawerLoadingState}>
            <CircularProgress size={28} />
            <Typography color="text.secondary">Loading roles...</Typography>
          </Stack>
        ) : (
          <Stack spacing={3} sx={layoutStyles.drawerBody}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            <MultiSelect
              control={control}
              helperText={roles.length === 0 ? "No assignable roles found in this workspace." : undefined}
              label="Roles"
              name="roleIds"
              options={roleOptions}
              placeholder="Search roles"
            />
            <Box sx={layoutStyles.flexGrow} />
            <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
              <Button onClick={onClose} variant="text">
                Cancel
              </Button>
              <Button
                aria-busy={isSubmitting}
                disabled={isSubmitting}
                onClick={handleSubmit(values => onSubmit(values.roleIds))}
                variant="contained"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
}
