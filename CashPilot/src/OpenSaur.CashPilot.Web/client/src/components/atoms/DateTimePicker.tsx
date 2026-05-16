import { TextField } from "@mui/material";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";

type PickerType = "date" | "datetime-local" | "time";

type BaseProps = {
  disabled?: boolean;
  helperText?: string;
  label: string;
  required?: boolean;
  type?: PickerType;
};

type RhfProps<TFieldValues extends FieldValues> = BaseProps & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

type ControlledProps = BaseProps & {
  error?: boolean;
  onChange: (value: string) => void;
  value: string;
};

type DateTimePickerProps<TFieldValues extends FieldValues> = RhfProps<TFieldValues> | ControlledProps;

export function DateTimePicker<TFieldValues extends FieldValues>(props: DateTimePickerProps<TFieldValues>) {
  const pickerType = props.type ?? "date";

  if ("control" in props) {
    const { control, disabled = false, helperText, label, name, required = false, rules } = props;

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
            InputLabelProps={{ shrink: true }}
            label={required ? `${label} *` : label}
            slotProps={{ formHelperText: { sx: { ml: 0 } } }}
            type={pickerType}
          />
        )}
        rules={rules}
      />
    );
  }

  const { disabled = false, error = false, helperText, label, onChange, required = false, value } = props;
  return (
    <TextField
      disabled={disabled}
      error={error}
      fullWidth
      helperText={helperText}
      InputLabelProps={{ shrink: true }}
      label={required ? `${label} *` : label}
      onChange={event => onChange(event.target.value)}
      slotProps={{ formHelperText: { sx: { ml: 0 } } }}
      type={pickerType}
      value={value}
    />
  );
}
