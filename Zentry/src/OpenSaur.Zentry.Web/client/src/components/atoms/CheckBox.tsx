import { Checkbox as MuiCheckbox, FormControlLabel } from "@mui/material";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";

type CheckBoxProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  label: string;
  name: FieldPath<TFieldValues>;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

export function CheckBox<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  label,
  name,
  rules
}: CheckBoxProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormControlLabel
          control={(
            <MuiCheckbox
              checked={Boolean(field.value)}
              disabled={disabled}
              onChange={event => {
                field.onChange(event.target.checked);
              }}
            />
          )}
          label={label}
        />
      )}
      rules={rules}
    />
  );
}
