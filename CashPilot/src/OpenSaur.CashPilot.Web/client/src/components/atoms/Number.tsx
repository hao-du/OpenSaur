import { TextField } from "@mui/material";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";

type NumberProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  label: string;
  name: FieldPath<TFieldValues>;
  required?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

export function Number<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  label,
  name,
  required = false,
  rules
}: NumberProps<TFieldValues>) {
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  const formatDisplayValue = (value: string | number) => {
    if (value === "" || value === undefined || value === null) return "";
    
    const stringValue = value.toString();
    const rawValue = stringValue.replace(/,/g, "");
    const num = parseFloat(rawValue);
    
    if (isNaN(num)) return stringValue;

    // Preserve decimal point and trailing zeros while typing
    const parts = rawValue.split(".");
    const formattedInt = formatter.format(parseInt(parts[0] || "0"));
    
    if (parts.length > 1) {
      return `${formattedInt}.${parts[1]}`;
    }
    
    // If it's just a number, format it
    return formattedInt;
  };

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
          helperText={fieldState.error?.message}
          inputMode="decimal"
          label={label}
          onChange={e => {
            const val = e.target.value;
            // Allow only numbers, one dot, and commas (which we remove)
            const rawValue = val.replace(/,/g, "");
            if (/^\d*\.?\d*$/.test(rawValue)) {
              field.onChange(rawValue);
            }
          }}
          required={required}
          value={formatDisplayValue(field.value)}
        />
      )}
      rules={rules}
    />
  );
}
