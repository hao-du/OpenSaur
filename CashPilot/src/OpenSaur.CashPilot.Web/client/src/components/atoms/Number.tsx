import { TextField } from "@mui/material";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";
import { formatInputNumberValue } from "../../infrastructure/constants/numberFormatters";

type NumberProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  helperText?: string;
  label: string;
  name: FieldPath<TFieldValues>;
  required?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

export function Number<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  helperText,
  label,
  name,
  required = false,
  rules
}: NumberProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          autoComplete="off"
          disabled={disabled}
          error={fieldState.error != null}
          fullWidth
          helperText={fieldState.error?.message ?? helperText}
          InputLabelProps={{
            sx: { "& .MuiFormLabel-asterisk": { color: "error.main" } }
          }}
          inputMode="decimal"
          label={required ? `${label} *` : label}
          onChange={e => {
            const val = e.target.value;
            // Allow only numbers, one dot, and commas (which we remove)
            const rawValue = val.replace(/,/g, "");
            if (/^\d*\.?\d*$/.test(rawValue)) {
              field.onChange(rawValue);
            }
          }}
          slotProps={{
            formHelperText: { sx: { ml: 0 } }
          }}
          value={formatInputNumberValue(field.value)}
        />
      )}
      rules={rules}
    />
  );
}

