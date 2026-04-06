import { useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Divider,
  Stack,
  TextField,
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
import type { RoleSummary } from "../../roles/types";
import { isSuperAdministrator } from "../../../app/router/protectedShellRoutes";
import { usePreferences } from "../../preferences/PreferenceProvider";

type WorkspaceFormValues = {
  description: string;
  isActive: boolean;
  maxActiveUsers: string;
  name: string;
  selectedRoleIds: string[];
};

type WorkspaceFormProps = {
  availableRoles: RoleSummary[];
  errorMessage: string | null;
  isEditMode: boolean;
  isSubmitting: boolean;
  initialValues: WorkspaceFormValues;
  onSubmit: (values: WorkspaceFormValues) => Promise<void>;
};

export function WorkspaceForm({
  availableRoles,
  errorMessage,
  initialValues,
  isEditMode,
  isSubmitting,
  onSubmit
}: WorkspaceFormProps) {
  const { t } = usePreferences();
  const {
    control,
    handleSubmit,
    setValue,
    watch
  } = useForm<WorkspaceFormValues>({
    values: initialValues
  });
  const selectedRoleIds = watch("selectedRoleIds");
  const assignableRoles = useMemo(
    () => availableRoles.filter(role => role.isActive && !isSuperAdministrator([role.normalizedName])),
    [availableRoles]
  );
  const selectedRoles = useMemo(() => {
    const selectedRoleIdSet = new Set(selectedRoleIds);

    return assignableRoles.filter(role => selectedRoleIdSet.has(role.id));
  }, [assignableRoles, selectedRoleIds]);

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
      <FormFieldList>
        <FormFieldBlock>
          <ControlledTextField
            control={control}
            disabled={isSubmitting}
            label={t("workspaces.form.name")}
            name="name"
            rules={{
              required: t("workspaces.form.nameRequired")
            }}
          />
        </FormFieldBlock>
        <FormFieldBlock>
          <ControlledTextArea
            control={control}
            disabled={isSubmitting}
            label={t("workspaces.form.description")}
            name="description"
          />
        </FormFieldBlock>
        <FormFieldBlock>
          <ControlledTextField
            control={control}
            disabled={isSubmitting}
            inputProps={{ min: 0, step: 1 }}
            label={t("workspaces.form.maxActiveUsers")}
            name="maxActiveUsers"
            rules={{
              validate: rawValue => {
                const value = String(rawValue ?? "");
                if (value.trim().length === 0) {
                  return true;
                }

                const parsedValue = Number(value);
                return Number.isInteger(parsedValue) && parsedValue >= 0
                  ? true
                  : t("workspaces.form.maxActiveUsersValidation");
              }
            }}
            type="number"
          />
        </FormFieldBlock>
      </FormFieldList>
      <Divider />
      <Stack spacing={2}>
        <Typography variant="h6">{t("workspaces.form.assignedRoles")}</Typography>
        <FormFieldList>
          <FormFieldBlock>
            <Autocomplete
              disableCloseOnSelect
              disabled={isSubmitting}
              filterSelectedOptions
              fullWidth
              getOptionLabel={option => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              multiple
              onChange={(_, value) => {
                setValue("selectedRoleIds", value.map(option => option.id), {
                  shouldDirty: true
                });
              }}
              options={assignableRoles}
              renderInput={params => (
                <TextField
                  {...params}
                  label={t("workspaces.form.assignedRoles")}
                  placeholder={t("workspaces.form.searchRoles")}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack spacing={0.25}>
                    <Typography>{option.name}</Typography>
                    {option.description ? (
                      <FormSupportText>{option.description}</FormSupportText>
                    ) : null}
                  </Stack>
                </li>
              )}
              value={selectedRoles}
            />
          </FormFieldBlock>
        </FormFieldList>
      </Stack>
      {isEditMode ? (
        <FormFieldBlock>
          <ControlledCheckbox
            control={control}
            disabled={isSubmitting}
            inputProps={{ "aria-label": t("workspaces.form.activeAriaLabel") }}
            label={t("workspaces.form.activeLabel")}
            name="isActive"
          />
        </FormFieldBlock>
      ) : null}
      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={1.5}
      >
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
