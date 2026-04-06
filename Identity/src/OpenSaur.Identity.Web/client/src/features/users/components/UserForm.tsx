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
import type { RoleCandidateSummary } from "../types";
import { isSuperAdministrator } from "../../../app/router/protectedShellRoutes";
import { usePreferences } from "../../preferences/PreferenceProvider";

type UserFormValues = {
  description: string;
  email: string;
  firstName: string;
  isActive: boolean;
  lastName: string;
  password: string;
  selectedRoleIds: string[];
  userName: string;
};

type UserFormProps = {
  errorMessage: string | null;
  initialValues: UserFormValues;
  isEditMode: boolean;
  isSubmitting: boolean;
  onSubmit: (values: UserFormValues) => Promise<void>;
  roleCandidates: RoleCandidateSummary[];
};

export function UserForm({
  errorMessage,
  initialValues,
  isEditMode,
  isSubmitting,
  onSubmit,
  roleCandidates
}: UserFormProps) {
  const { t } = usePreferences();
  const {
    control,
    handleSubmit,
    setValue,
    watch
  } = useForm<UserFormValues>({
    values: initialValues
  });
  const selectedRoleIds = watch("selectedRoleIds");
  const assignableRoleCandidates = useMemo(
    () => roleCandidates.filter(role => !isSuperAdministrator([role.roleNormalizedName])),
    [roleCandidates]
  );
  const selectedRoles = useMemo(() => {
    const selectedRoleIdSet = new Set(selectedRoleIds);
    return assignableRoleCandidates.filter(role => selectedRoleIdSet.has(role.roleId));
  }, [assignableRoleCandidates, selectedRoleIds]);

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
        <Typography variant="h6">{t("users.form.user")}</Typography>
        <FormFieldList>
          <FormFieldBlock>
            <ControlledTextField
              control={control}
              disabled={isSubmitting}
              label={t("users.form.userName")}
              name="userName"
              rules={{
                required: t("users.form.userNameRequired")
              }}
            />
          </FormFieldBlock>
          <FormFieldBlock>
            <ControlledTextField
              control={control}
              disabled={isSubmitting}
              label={t("users.form.firstName")}
              name="firstName"
            />
          </FormFieldBlock>
          <FormFieldBlock>
            <ControlledTextField
              control={control}
              disabled={isSubmitting}
              label={t("users.form.lastName")}
              name="lastName"
            />
          </FormFieldBlock>
          <FormFieldBlock>
            <ControlledTextField
              control={control}
              disabled={isSubmitting}
              label={t("users.form.email")}
              name="email"
              rules={{
                required: t("users.form.emailRequired")
              }}
              type="email"
            />
          </FormFieldBlock>
          {!isEditMode ? (
            <FormFieldBlock>
              <ControlledTextField
                control={control}
                disabled={isSubmitting}
                label={t("users.form.temporaryPassword")}
                name="password"
                rules={{
                  required: t("users.form.temporaryPasswordRequired")
                }}
                type="password"
              />
            </FormFieldBlock>
          ) : null}
          <FormFieldBlock>
            <ControlledTextArea
              control={control}
              disabled={isSubmitting}
              label={t("users.form.description")}
              name="description"
            />
          </FormFieldBlock>
          {isEditMode ? (
            <FormFieldBlock>
              <ControlledCheckbox
                control={control}
                disabled={isSubmitting}
                inputProps={{ "aria-label": t("users.form.activeAriaLabel") }}
                label={t("users.form.activeLabel")}
                name="isActive"
              />
            </FormFieldBlock>
          ) : null}
        </FormFieldList>
      </Stack>
      <Divider />
      <Stack spacing={2}>
        <Typography variant="h6">{t("users.form.assignedRoles")}</Typography>
        <FormFieldList>
          <FormFieldBlock>
            <Autocomplete
              disableCloseOnSelect
              disabled={isSubmitting}
              filterSelectedOptions
              fullWidth
              getOptionLabel={option => option.roleName}
              isOptionEqualToValue={(option, value) => option.roleId === value.roleId}
              multiple
              onChange={(_, value) => {
                setValue("selectedRoleIds", value.map(option => option.roleId), {
                  shouldDirty: true
                });
              }}
              options={assignableRoleCandidates}
              renderInput={params => (
                <TextField
                  {...params}
                  label={t("users.form.role")}
                  placeholder={t("common.searchActiveRoles")}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.roleId}>
                  <Stack spacing={0.25}>
                    <Typography>{option.roleName}</Typography>
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
