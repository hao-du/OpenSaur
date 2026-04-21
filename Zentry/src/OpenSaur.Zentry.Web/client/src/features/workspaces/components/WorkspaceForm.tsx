import { Alert, Button, Checkbox, CircularProgress, Divider, FormControlLabel, FormGroup, Paper, Stack, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import type { AssignableWorkspaceRoleDto } from "../dtos/AssignableWorkspaceRoleDto";

export type WorkspaceFormValues = {
  description: string;
  isActive: boolean;
  maxActiveUsers: string;
  name: string;
  selectedRoleIds: string[];
};

type WorkspaceFormProps = {
  availableRoles: AssignableWorkspaceRoleDto[];
  errorMessage: string | null;
  initialValues: WorkspaceFormValues;
  isEditMode: boolean;
  isSubmitting: boolean;
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
  const { control, handleSubmit } = useForm<WorkspaceFormValues>({
    values: initialValues
  });

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
      <Text
        control={control}
        disabled={isSubmitting}
        label="Workspace name"
        name="name"
        required
        rules={{ required: "Workspace name is required." }}
      />
      <TextArea
        control={control}
        disabled={isSubmitting}
        label="Description"
        name="description"
      />
      <Text
        control={control}
        disabled={isSubmitting}
        helperText="Leave blank for no workspace limit."
        label="Maximum active users"
        name="maxActiveUsers"
        rules={{
          validate: value => {
            const normalizedValue = String(value ?? "").trim();
            if (normalizedValue.length === 0) {
              return true;
            }

            const parsedValue = Number(normalizedValue);
            return Number.isInteger(parsedValue) && parsedValue >= 0
              ? true
              : "Maximum active users must be a whole number that is zero or greater.";
          }
        }}
        type="number"
      />
      <Divider />
      <Stack spacing={2}>
        <Typography variant="h6">Assigned roles</Typography>
        {availableRoles.length === 0 ? (
          <Paper elevation={0} variant="outlined">
            <Stack spacing={1.5} sx={{ p: 2 }}>
              <Typography>No assignable roles found.</Typography>
              <Typography color="text.secondary" variant="body2">
                Create active roles before assigning them to a workspace.
              </Typography>
            </Stack>
          </Paper>
        ) : (
          <Controller
            control={control}
            name="selectedRoleIds"
            render={({ field }) => {
              const selectedRoleIds = new Set(field.value ?? []);

              return (
                <FormGroup>
                  {availableRoles.map(role => (
                    <FormControlLabel
                      control={(
                        <Checkbox
                          checked={selectedRoleIds.has(role.id)}
                          disabled={isSubmitting}
                          onChange={event => {
                            const nextRoleIds = event.target.checked
                              ? [...selectedRoleIds, role.id]
                              : [...selectedRoleIds].filter(roleId => roleId !== role.id);

                            field.onChange(nextRoleIds);
                          }}
                        />
                      )}
                      key={role.id}
                      label={(
                        <Stack spacing={0.25}>
                          <Typography>{role.name}</Typography>
                          {role.description ? (
                            <Typography color="text.secondary" variant="body2">
                              {role.description}
                            </Typography>
                          ) : null}
                        </Stack>
                      )}
                    />
                  ))}
                </FormGroup>
              );
            }}
          />
        )}
      </Stack>
      {isEditMode ? (
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <FormControlLabel
              control={(
                <Checkbox
                  checked={field.value}
                  disabled={isSubmitting}
                  onChange={event => {
                    field.onChange(event.target.checked);
                  }}
                />
              )}
              label="Workspace is active"
            />
          )}
        />
      ) : null}
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
