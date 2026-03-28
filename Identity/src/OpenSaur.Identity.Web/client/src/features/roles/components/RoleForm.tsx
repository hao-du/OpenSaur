import { useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Stack,
  Typography
} from "@mui/material";
import {
  ControlledCheckbox,
  ControlledTextArea,
  ControlledTextField
} from "../../../components/molecules/controlled";
import type { PermissionSummary } from "../types";

type RoleFormValues = {
  description: string;
  isActive: boolean;
  name: string;
  permissionCodeIds: number[];
};

type RoleFormProps = {
  errorMessage: string | null;
  initialValues: RoleFormValues;
  isEditMode: boolean;
  isSubmitting: boolean;
  permissions: PermissionSummary[];
  onSubmit: (values: RoleFormValues) => Promise<void>;
};

export function RoleForm({
  errorMessage,
  initialValues,
  isEditMode,
  isSubmitting,
  permissions,
  onSubmit
}: RoleFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    watch
  } = useForm<RoleFormValues>({
    values: initialValues
  });
  const permissionCodeIds = watch("permissionCodeIds");
  const groupedPermissions = useMemo(() => {
    const byScope = new Map<string, PermissionSummary[]>();

    for (const permission of permissions) {
      const scopePermissions = byScope.get(permission.permissionScopeName) ?? [];
      scopePermissions.push(permission);
      byScope.set(permission.permissionScopeName, scopePermissions);
    }

    return [...byScope.entries()];
  }, [permissions]);

  function togglePermission(codeId: number, checked: boolean) {
    const nextPermissionCodeIds = checked
      ? [...permissionCodeIds, codeId]
      : permissionCodeIds.filter(existingCodeId => existingCodeId !== codeId);

    setValue("permissionCodeIds", [...new Set(nextPermissionCodeIds)].sort((left, right) => left - right), {
      shouldDirty: true
    });
  }

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={handleSubmit(async values => {
        await onSubmit(values);
      })}
      spacing={3}
    >
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      <Stack spacing={2}>
        <Typography variant="h6">Role</Typography>
        <ControlledTextField
          control={control}
          disabled={isSubmitting}
          label="Role name"
          name="name"
          rules={{
            required: "Role name is required."
          }}
        />
        <ControlledTextArea
          control={control}
          disabled={isSubmitting}
          label="Description"
          name="description"
        />
        {isEditMode ? (
          <ControlledCheckbox
            control={control}
            disabled={isSubmitting}
            inputProps={{ "aria-label": "Role is active" }}
            label="Role is active"
            name="isActive"
          />
        ) : null}
      </Stack>
      <Divider />
      <Stack spacing={2}>
        <Typography variant="h6">Permissions</Typography>
        <Stack spacing={2}>
          {groupedPermissions.map(([scopeName, scopedPermissions]) => (
            <Stack key={scopeName} spacing={1.25}>
              <Typography color="text.secondary" variant="body2">
                {scopeName}
              </Typography>
              <Box
                sx={{
                  border: "1px solid rgba(11,110,79,0.12)",
                  borderRadius: 1,
                  p: 2
                }}
              >
                <Stack spacing={1}>
                  {scopedPermissions.map(permission => (
                    <FormControlLabel
                      control={(
                        <Checkbox
                          checked={permissionCodeIds.includes(permission.codeId)}
                          disabled={isSubmitting}
                          onChange={(_, checked) => {
                            togglePermission(permission.codeId, checked);
                          }}
                        />
                      )}
                      key={permission.id}
                      label={(
                        <Stack spacing={0.25}>
                          <Typography>{permission.name}</Typography>
                          <Typography color="text.secondary" variant="body2">
                            {permission.description}
                          </Typography>
                        </Stack>
                      )}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Stack>
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button
          aria-busy={isSubmitting}
          disabled={isSubmitting}
          startIcon={isSubmitting
            ? <CircularProgress color="inherit" size={18} />
            : undefined}
          type="submit"
          variant="contained"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </Stack>
  );
}
