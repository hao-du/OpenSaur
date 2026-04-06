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
import {
  FormFieldBlock,
  FormFieldList,
  FormSupportText
} from "../../../components/molecules";
import type { PermissionSummary } from "../types";
import { usePreferences } from "../../preferences/PreferenceProvider";

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
  const { t } = usePreferences();
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
        <Typography variant="h6">{t("roles.form.role")}</Typography>
        <FormFieldList>
          <FormFieldBlock>
            <ControlledTextField
              control={control}
              disabled={isSubmitting}
              label={t("roles.form.name")}
              name="name"
              rules={{
                required: t("roles.form.nameRequired")
              }}
            />
          </FormFieldBlock>
          <FormFieldBlock>
            <ControlledTextArea
              control={control}
              disabled={isSubmitting}
              label={t("roles.form.description")}
              name="description"
            />
          </FormFieldBlock>
          {isEditMode ? (
            <FormFieldBlock>
              <ControlledCheckbox
                control={control}
                disabled={isSubmitting}
                inputProps={{ "aria-label": t("roles.form.activeAriaLabel") }}
                label={t("roles.form.activeLabel")}
                name="isActive"
              />
            </FormFieldBlock>
          ) : null}
        </FormFieldList>
      </Stack>
      <Divider />
      <Stack spacing={2}>
        <Typography variant="h6">{t("roles.form.permissions")}</Typography>
        <FormFieldList>
          {groupedPermissions.map(([scopeName, scopedPermissions]) => (
            <FormFieldBlock key={scopeName}>
              <FormSupportText>
                {t("roles.form.permissionScope")}: {scopeName}
              </FormSupportText>
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
                      disableTypography
                      key={permission.id}
                      label={(
                        <Stack spacing={0.25}>
                          <Typography>{permission.name}</Typography>
                          {permission.description ? (
                            <FormSupportText>{permission.description}</FormSupportText>
                          ) : null}
                        </Stack>
                      )}
                    />
                  ))}
                </Stack>
              </Box>
            </FormFieldBlock>
          ))}
        </FormFieldList>
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
          {isSubmitting ? t("common.saving") : t("common.save")}
        </Button>
      </Stack>
    </Stack>
  );
}
