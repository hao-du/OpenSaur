import { TextField } from "@mui/material";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";

type TextAreaProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  helperText?: string;
  label: string;
  minRows?: number;
  name: FieldPath<TFieldValues>;
  required?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

export function TextArea<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  helperText,
  label,
  minRows = 4,
  name,
  required = false,
  rules
}: TextAreaProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          disabled={disabled}
          error={fieldState.error != null}
          fullWidth
          helperText={fieldState.error?.message ?? helperText}
          label={required ? `${label} *` : label}
          minRows={minRows}
          multiline
          slotProps={{
            formHelperText: { sx: { ml: 0 } },
            inputLabel: { sx: { "& .MuiFormLabel-asterisk": { color: "error.main" } } }
          }}
        />
      )}
      rules={rules}
    />
  );
}

