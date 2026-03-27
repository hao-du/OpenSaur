import type { Control, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Controller } from "react-hook-form";
import { PasswordField } from "../PasswordField";

type ControlledPasswordFieldProps<TFieldValues extends FieldValues> = {
  autoComplete?: string;
  control: Control<TFieldValues>;
  disabled?: boolean;
  label: string;
  name: FieldPath<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
};

export function ControlledPasswordField<TFieldValues extends FieldValues>({
  autoComplete,
  control,
  disabled,
  label,
  name,
  rules
}: ControlledPasswordFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <PasswordField
          autoComplete={autoComplete}
          disabled={disabled}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          label={label}
          name={field.name}
          onBlur={field.onBlur}
          onChange={field.onChange}
          value={field.value ?? ""}
        />
      )}
      rules={rules}
    />
  );
}
