import { MenuItem, TextField } from "@mui/material";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";

type DropDownOption = {
  label: string;
  value: string;
};

type DropDownProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  helperText?: string;
  label: string;
  name: FieldPath<TFieldValues>;
  options: DropDownOption[];
  required?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

export function DropDown<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  helperText,
  label,
  name,
  options,
  required = false,
  rules
}: DropDownProps<TFieldValues>) {
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
          label={label}
          required={required}
          select
        >
          {options.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
      rules={rules}
    />
  );
}
