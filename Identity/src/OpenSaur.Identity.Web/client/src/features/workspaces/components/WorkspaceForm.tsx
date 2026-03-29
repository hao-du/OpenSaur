import { useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import {
  ControlledCheckbox,
  ControlledTextArea,
  ControlledTextField
} from "../../../components/molecules/controlled";
import type { RoleSummary } from "../../roles/types";
import { isSuperAdministrator } from "../../../app/router/protectedShellRoutes";

type WorkspaceFormValues = {
  description: string;
  isActive: boolean;
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
      <ControlledTextField
        control={control}
        label="Workspace name"
        name="name"
        rules={{
          required: "Workspace name is required."
        }}
      />
      <ControlledTextArea
        control={control}
        label="Description"
        name="description"
      />
      <Stack spacing={2}>
        <Typography variant="h6">Assigned Roles</Typography>
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
              label="Assigned Roles"
              placeholder="Search active roles"
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Stack spacing={0.25}>
                <Typography>{option.name}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {option.description}
                </Typography>
              </Stack>
            </li>
          )}
          value={selectedRoles}
        />
      </Stack>
      {isEditMode ? (
        <ControlledCheckbox
          control={control}
          inputProps={{ "aria-label": "Workspace is active" }}
          label="Workspace is active"
          name="isActive"
        />
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
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </Stack>
  );
}
