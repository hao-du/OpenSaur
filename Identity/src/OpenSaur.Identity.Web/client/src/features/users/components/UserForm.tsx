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
import type { RoleCandidateSummary } from "../types";
import { isSuperAdministrator } from "../../../app/router/protectedShellRoutes";

type UserFormValues = {
  description: string;
  email: string;
  isActive: boolean;
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
        <Typography variant="h6">User</Typography>
        <ControlledTextField
          control={control}
          disabled={isSubmitting}
          label="User name"
          name="userName"
          rules={{
            required: "User name is required."
          }}
        />
        <ControlledTextField
          control={control}
          disabled={isSubmitting}
          label="Email"
          name="email"
          rules={{
            required: "Email is required."
          }}
          type="email"
        />
        {!isEditMode ? (
          <ControlledTextField
            control={control}
            disabled={isSubmitting}
            label="Temporary password"
            name="password"
            rules={{
              required: "Temporary password is required."
            }}
            type="password"
          />
        ) : null}
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
            inputProps={{ "aria-label": "User is active" }}
            label="User is active"
            name="isActive"
          />
        ) : null}
      </Stack>
      <Divider />
      <Stack spacing={2}>
        <Typography variant="h6">Assigned Roles</Typography>
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
              label="Role"
              placeholder="Search active roles"
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.roleId}>
              <Stack spacing={0.25}>
                <Typography>{option.roleName}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {option.description}
                </Typography>
              </Stack>
            </li>
          )}
          value={selectedRoles}
        />
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
