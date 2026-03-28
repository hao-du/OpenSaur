import type { Control, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Controller } from "react-hook-form";
import { TextField, type TextFieldProps } from "@mui/material";

type ControlledTextAreaProps<TFieldValues extends FieldValues> =
  Omit<TextFieldProps, "defaultValue" | "error" | "helperText" | "multiline" | "name" | "onBlur" | "onChange" | "value"> & {
    control: Control<TFieldValues>;
    minRows?: number;
    name: FieldPath<TFieldValues>;
    rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
  };

export function ControlledTextArea<TFieldValues extends FieldValues>({
  control,
  minRows = 3,
  name,
  rules,
  ...props
}: ControlledTextAreaProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          error={Boolean(fieldState.error)}
          fullWidth
          helperText={fieldState.error?.message}
          minRows={minRows}
          multiline
          variant="outlined"
          {...props}
          {...field}
        />
      )}
      rules={rules}
    />
  );
}
