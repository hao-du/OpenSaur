import { Alert, Button, CircularProgress, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";

export type UserFormValues = {
  description: string;
  email: string;
  firstName: string;
  isActive: boolean;
  lastName: string;
  password: string;
  requirePasswordChange: boolean;
  userName: string;
};

type UserFormProps = {
  errorMessage: string | null;
  initialValues: UserFormValues;
  isEditMode: boolean;
  isSubmitting: boolean;
  onSubmit: (values: UserFormValues) => Promise<void>;
};

export function UserForm({
  errorMessage,
  initialValues,
  isEditMode,
  isSubmitting,
  onSubmit
}: UserFormProps) {
  const { control, handleSubmit } = useForm<UserFormValues>({
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
        label="User name"
        name="userName"
        required
        rules={{ required: "User name is required." }}
      />
      <Text
        control={control}
        disabled={isSubmitting}
        label="Email"
        name="email"
        required
        rules={{ required: "Email is required." }}
        type="email"
      />
      <Text control={control} disabled={isSubmitting} label="First name" name="firstName" />
      <Text control={control} disabled={isSubmitting} label="Last name" name="lastName" />
      <TextArea control={control} disabled={isSubmitting} label="Description" name="description" />
      {!isEditMode ? (
        <Text
          control={control}
          disabled={isSubmitting}
          label="Temporary password"
          name="password"
          required
          rules={{
            minLength: {
              message: "Password must be at least 8 characters.",
              value: 8
            },
            required: "Temporary password is required."
          }}
          type="password"
        />
      ) : null}
      <CheckBox
        control={control}
        disabled={isSubmitting}
        label="Require password change"
        name="requirePasswordChange"
      />
      {isEditMode ? (
        <CheckBox
          control={control}
          disabled={isSubmitting}
          label="User is active"
          name="isActive"
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
