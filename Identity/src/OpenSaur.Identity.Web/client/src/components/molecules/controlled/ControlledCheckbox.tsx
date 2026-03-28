import type { Control, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Checkbox, FormControlLabel, type CheckboxProps, type FormControlLabelProps } from "@mui/material";

type ControlledCheckboxProps<TFieldValues extends FieldValues> =
  Omit<CheckboxProps, "checked" | "defaultChecked" | "name" | "onBlur" | "onChange" | "value"> & {
    control: Control<TFieldValues>;
    label: FormControlLabelProps["label"];
    name: FieldPath<TFieldValues>;
    rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
  };

export function ControlledCheckbox<TFieldValues extends FieldValues>({
  control,
  label,
  name,
  rules,
  ...props
}: ControlledCheckboxProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormControlLabel
          control={(
            <Checkbox
              {...props}
              checked={Boolean(field.value)}
              onBlur={field.onBlur}
              onChange={(_, checked) => {
                field.onChange(checked);
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
