import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";

type DatePickerProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  label: string;
  name: FieldPath<TFieldValues>;
  required?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

export function DatePicker<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  label,
  name,
  required = false,
  rules
}: DatePickerProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DateTimePicker
          disabled={disabled}
          label={label}
          onChange={value => {
            field.onChange(value == null ? "" : value.format("YYYY-MM-DDTHH:mm"));
          }}
          slotProps={{
            textField: {
              error: fieldState.error != null,
              fullWidth: true,
              helperText: fieldState.error?.message,
              required: required
            }
          }}
          value={field.value.trim().length === 0 ? null : dayjs(field.value)}
        />
      )}
      rules={rules}
    />
  );
}
