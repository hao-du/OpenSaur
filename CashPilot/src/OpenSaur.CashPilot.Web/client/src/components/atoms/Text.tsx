import { TextField } from "@mui/material";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";

type TextProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  helperText?: string;
  label: string;
  name: FieldPath<TFieldValues>;
  required?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
  shouldUnregister?: boolean;
  type?: string;
  variant?: "outlined" | "standard" | "filled";
};

export function Text<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  helperText,
  label,
  name,
  required = false,
  rules,
  shouldUnregister = false,
  type = "text",
  variant = "outlined"
}: TextProps<TFieldValues>) {
  const shouldShrinkLabel = type === "date" || type === "datetime-local" || type === "time";

  return (
    <Controller
      control={control}
      name={name}
      shouldUnregister={shouldUnregister}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          disabled={disabled}
          error={fieldState.error != null}
          fullWidth
          helperText={fieldState.error?.message ?? helperText}
          InputLabelProps={shouldShrinkLabel ? { shrink: true } : undefined}
          label={label}
          required={required}
          type={type}
          variant={variant}
        />
      )}
      rules={rules}
    />
  );
}
