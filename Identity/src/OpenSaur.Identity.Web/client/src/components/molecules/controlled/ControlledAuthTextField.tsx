import type { Control, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Controller } from "react-hook-form";
import { AuthTextField } from "../../atoms";
import type { AuthTextFieldProps } from "../../atoms/AuthTextField";

type ControlledAuthTextFieldProps<TFieldValues extends FieldValues> =
  Omit<AuthTextFieldProps, "error" | "helperText" | "name" | "onBlur" | "onChange" | "value"> & {
    control: Control<TFieldValues>;
    name: FieldPath<TFieldValues>;
    rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
  };

export function ControlledAuthTextField<TFieldValues extends FieldValues>({
  control,
  name,
  rules,
  ...props
}: ControlledAuthTextFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <AuthTextField
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          {...props}
          {...field}
        />
      )}
      rules={rules}
    />
  );
}
