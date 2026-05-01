import { TextField } from "@mui/material";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";

type FormTextFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
  type?: string;
  autoComplete?: string;
};

export function FormTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  rules,
  type,
  autoComplete
}: FormTextFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          slotProps={{
            formHelperText: {
              sx: {
                mt: 1,
                mx: 0
              }
            }
          }}
          label={label}
          type={type}
          autoComplete={autoComplete}
          error={fieldState.invalid}
          helperText={fieldState.error?.message}
          fullWidth
        />
      )}
    />
  );
}
