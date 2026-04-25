import { Alert, Box, Button, ButtonBase, Checkbox, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import type { PermissionSummaryDto } from "../dtos/PermissionSummaryDto";

export type RoleFormValues = {
  description: string;
  isActive: boolean;
  name: string;
  permissionCodes: string[];
};

type RoleFormProps = {
  errorMessage: string | null;
  initialValues: RoleFormValues;
  isEditMode: boolean;
  isSubmitting: boolean;
  onSubmit: (values: RoleFormValues) => Promise<void>;
  permissions: PermissionSummaryDto[];
};

type PermissionScopeGroup = {
  permissions: PermissionSummaryDto[];
  scopeId: string;
  scopeName: string;
};

export function RoleForm({
  errorMessage,
  initialValues,
  isEditMode,
  isSubmitting,
  onSubmit,
  permissions
}: RoleFormProps) {
  const { control, handleSubmit } = useForm<RoleFormValues>({
    values: initialValues
  });
  const permissionGroups = useMemo<PermissionScopeGroup[]>(() => {
    const groups = new Map<string, PermissionScopeGroup>();

    for (const permission of permissions) {
      if (!permission.isActive) {
        continue;
      }

      const existingGroup = groups.get(permission.permissionScopeId);
      if (existingGroup) {
        existingGroup.permissions.push(permission);
        continue;
      }

      groups.set(permission.permissionScopeId, {
        permissions: [permission],
        scopeId: permission.permissionScopeId,
        scopeName: permission.permissionScopeName
      });
    }

    return Array.from(groups.values());
  }, [permissions]);

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
        <Text
          control={control}
          disabled={isSubmitting}
          label="Name"
          name="name"
          required
          rules={{
            required: "Role name is required."
          }}
        />
        <TextArea
          control={control}
          disabled={isSubmitting}
          label="Description"
          name="description"
        />
        {isEditMode ? (
          <CheckBox
            control={control}
            disabled={isSubmitting}
            label="Active"
            name="isActive"
          />
        ) : null}
      </Stack>
      <Divider />
      <Stack spacing={2}>
        <Typography variant="h6">Permissions</Typography>
        <Controller
          control={control}
          name="permissionCodes"
          render={({ field }) => {
            const selectedCodes = Array.isArray(field.value) ? field.value : [];

            return (
              <Stack spacing={2.5}>
                {permissionGroups.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No active permissions are available.
                  </Typography>
                ) : permissionGroups.map(group => {
                  const scopeCodes = new Set(group.permissions.map(permission => permission.code));

                  return (
                    <Stack key={group.scopeId} spacing={1}>
                      <Typography color="primary" variant="body2">
                        Permission scope: {group.scopeName}
                      </Typography>
                      <Stack spacing={1}>
                        {group.permissions.map(permission => {
                          const isSelected = selectedCodes.includes(permission.code);

                          return (
                            <ButtonBase
                              key={permission.code}
                              disabled={isSubmitting}
                              onClick={() => {
                                if (isSelected) {
                                  field.onChange(selectedCodes.filter(code => code !== permission.code));
                                  return;
                                }

                                field.onChange([
                                  ...selectedCodes.filter(code => !scopeCodes.has(code)),
                                  permission.code
                                ]);
                              }}
                              sx={{
                                alignItems: "flex-start",
                                border: 1,
                                borderColor: isSelected ? "primary.main" : "divider",
                                borderRadius: 1,
                                display: "flex",
                                gap: 1.5,
                                justifyContent: "flex-start",
                                p: 2,
                                textAlign: "left",
                                width: "100%"
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                disabled={isSubmitting}
                                sx={{ p: 0.25 }}
                                tabIndex={-1}
                              />
                              <Box>
                                <Typography variant="body1">{permission.name}</Typography>
                                {permission.description ? (
                                  <Typography color="primary" variant="body2">
                                    {permission.description}
                                  </Typography>
                                ) : null}
                              </Box>
                            </ButtonBase>
                          );
                        })}
                      </Stack>
                    </Stack>
                  );
                })}
              </Stack>
            );
          }}
        />
      </Stack>
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : undefined}
          type="submit"
          variant="contained"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </Stack>
  );
}
