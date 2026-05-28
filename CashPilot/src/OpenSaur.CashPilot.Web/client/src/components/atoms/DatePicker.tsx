import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";
import { useSettings } from "../../features/settings/provider/SettingProvider";

dayjs.extend(localizedFormat);

type RhfDatePickerProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  helperText?: string;
  label: string;
  name: FieldPath<TFieldValues>;
  mode?: "date" | "month" | "year";
  required?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

type ControlledDatePickerProps = {
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label: string;
  mode?: "date" | "month" | "year";
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
};

type DatePickerProps<TFieldValues extends FieldValues> = RhfDatePickerProps<TFieldValues> | ControlledDatePickerProps;

export function DatePicker<TFieldValues extends FieldValues>(props: DatePickerProps<TFieldValues>) {
  const { locale } = useSettings();
  dayjs.locale(locale);
  const displayFormat = props.mode === "month"
    ? "MM/YYYY"
    : props.mode === "year"
      ? "YYYY"
      : "L";

  if ("control" in props) {
    const {
      control,
      disabled = false,
      helperText,
      label,
      mode = "date",
      name,
      required = false,
      rules
    } = props;

    return (
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <MuiDatePicker
            disabled={disabled}
            format={displayFormat}
            label={required ? `${label} *` : label}
            onChange={value => {
              if (value == null) {
                field.onChange("");
                return;
              }
              field.onChange(mode === "month" ? value.format("YYYY-MM") : mode === "year" ? value.format("YYYY") : value.format("YYYY-MM-DD"));
            }}
            slotProps={{
              textField: {
                error: fieldState.error != null,
                fullWidth: true,
                helperText: fieldState.error?.message ?? helperText,
                required: false
              }
            }}
            value={typeof field.value === "string" && field.value.trim().length > 0 ? dayjs(field.value) : null}
            views={mode === "month" ? ["month", "year"] : mode === "year" ? ["year"] : ["day", "month", "year"]}
          />
        )}
        rules={rules}
      />
    );
  }

  const {
    disabled = false,
    error = false,
    helperText,
    label,
    mode = "date",
    onChange,
    required = false,
    value
  } = props;

  return (
    <MuiDatePicker
      disabled={disabled}
      format={displayFormat}
      label={required ? `${label} *` : label}
      onChange={nextValue => {
        if (nextValue == null) {
          onChange("");
          return;
        }
        onChange(mode === "month" ? nextValue.format("YYYY-MM") : mode === "year" ? nextValue.format("YYYY") : nextValue.format("YYYY-MM-DD"));
      }}
      slotProps={{
        textField: {
          error,
          fullWidth: true,
          helperText,
          required: false
        }
      }}
      value={typeof value === "string" && value.trim().length > 0 ? dayjs(value) : null}
      views={mode === "month" ? ["month", "year"] : mode === "year" ? ["year"] : ["day", "month", "year"]}
    />
  );
}
