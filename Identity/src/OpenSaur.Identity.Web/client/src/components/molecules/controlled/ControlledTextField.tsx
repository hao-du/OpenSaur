import type { Control, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Controller } from "react-hook-form";
import { TextField, type TextFieldProps } from "@mui/material";

type ControlledTextFieldProps<TFieldValues extends FieldValues> =
  Omit<TextFieldProps, "defaultValue" | "error" | "helperText" | "name" | "onBlur" | "onChange" | "value"> & {
    control: Control<TFieldValues>;
    name: FieldPath<TFieldValues>;
    rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
  };

export function ControlledTextField<TFieldValues extends FieldValues>({
  control,
  name,
  rules,
  ...props
}: ControlledTextFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          error={Boolean(fieldState.error)}
          fullWidth
          helperText={fieldState.error?.message}
          variant="outlined"
          {...props}
          {...field}
        />
      )}
      rules={rules}
    />
  );
}
