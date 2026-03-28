import { useForm } from "react-hook-form";
import {
  Alert,
  Button,
  CircularProgress,
  Stack
} from "@mui/material";
import {
  ControlledCheckbox,
  ControlledTextArea,
  ControlledTextField
} from "../../../components/molecules/controlled";

type WorkspaceFormValues = {
  description: string;
  isActive: boolean;
  name: string;
};

type WorkspaceFormProps = {
  errorMessage: string | null;
  isEditMode: boolean;
  isSubmitting: boolean;
  initialValues: WorkspaceFormValues;
  onSubmit: (values: WorkspaceFormValues) => Promise<void>;
};

export function WorkspaceForm({
  errorMessage,
  initialValues,
  isEditMode,
  isSubmitting,
  onSubmit
}: WorkspaceFormProps) {
  const {
    control,
    handleSubmit
  } = useForm<WorkspaceFormValues>({
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
      {isEditMode ? (
        <ControlledCheckbox
          control={control}
          inputProps={{ "aria-label": "Workspace is active" }}
          label="Workspace is active"
          name="isActive"
        />
      ) : (
        <Alert severity="info">
          New workspaces start in the active state.
        </Alert>
      )}
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
          {isSubmitting
            ? (isEditMode ? "Saving workspace..." : "Creating workspace...")
            : (isEditMode ? "Save workspace" : "Create workspace")}
        </Button>
      </Stack>
    </Stack>
  );
}
