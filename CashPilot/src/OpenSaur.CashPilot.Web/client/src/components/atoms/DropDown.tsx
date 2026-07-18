import { Autocomplete, Box, MenuItem, Stack, TextField } from "@mui/material";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";

type DropDownOption = {
  icon?: ReactNode;
  label: string;
  textColor?: string;
  value: string;
};

type DropDownProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  filterable?: boolean;
  helperText?: string;
  label: string;
  name: FieldPath<TFieldValues>;
  options: DropDownOption[];
  placeholder?: string;
  required?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

type FilterableDropDownProps = {
  disabled: boolean;
  fieldErrorMessage?: string;
  helperText?: string;
  label: string;
  optionValue: string;
  options: DropDownOption[];
  placeholder?: string;
  required: boolean;
  onChange: (value: string) => void;
};

function FilterableDropDown({
  disabled,
  fieldErrorMessage,
  helperText,
  label,
  optionValue,
  options,
  placeholder,
  required,
  onChange
}: FilterableDropDownProps) {
  const selectedOption = options.find(option => option.value === optionValue) ?? null;
  const [inputValue, setInputValue] = useState(selectedOption?.label ?? "");

  useEffect(() => {
    setInputValue(selectedOption?.label ?? "");
  }, [selectedOption?.label]);

  return (
    <Autocomplete
      autoHighlight
      clearOnBlur
      disabled={disabled}
      getOptionLabel={option => option.label}
      inputValue={inputValue}
      openOnFocus
      forcePopupIcon
      isOptionEqualToValue={(option, value) => option.value === value.value}
      onChange={(_, nextOption) => {
        onChange(nextOption?.value ?? "");
        setInputValue(nextOption?.label ?? "");
      }}
      onInputChange={(_, nextInputValue, reason) => {
        if (reason === "reset") {
          return;
        }

        setInputValue(nextInputValue);
      }}
      options={options}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;

        return (
          <li {...optionProps} key={key}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              {option.icon ? <Box sx={{ color: option.textColor }}>{option.icon}</Box> : null}
              <Box sx={{ color: option.textColor }}>{option.label}</Box>
            </Stack>
          </li>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          error={fieldErrorMessage != null}
          fullWidth
          helperText={fieldErrorMessage ?? helperText}
          label={required ? `${label} *` : label}
          placeholder={placeholder}
          slotProps={{
            ...params.slotProps,
            formHelperText: { sx: { ml: 0 } },
            inputLabel: { sx: { "& .MuiFormLabel-asterisk": { color: "error.main" } } }
          }}
        />
      )}
      value={selectedOption}
    />
  );
}

export function DropDown<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  filterable = false,
  helperText,
  label,
  name,
  options,
  placeholder,
  required = false,
  rules
}: DropDownProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        if (filterable) {
          return (
            <FilterableDropDown
              disabled={disabled}
              fieldErrorMessage={fieldState.error?.message}
              helperText={helperText}
              label={label}
              onChange={field.onChange}
              optionValue={String(field.value ?? "")}
              options={options}
              placeholder={placeholder}
              required={required}
            />
          );
        }

        return (
          <TextField
            {...field}
            disabled={disabled}
            error={fieldState.error != null}
            fullWidth
            helperText={fieldState.error?.message ?? helperText}
            slotProps={{
              formHelperText: { sx: { ml: 0 } },
              inputLabel: { sx: { "& .MuiFormLabel-asterisk": { color: "error.main" } } }
            }}
            label={required ? `${label} *` : label}
            select
          >
            {options.map(option => (
              <MenuItem key={option.value} value={option.value}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  {option.icon ? <Box sx={{ color: option.textColor, display: "inline-flex" }}>{option.icon}</Box> : null}
                  <Box sx={{ color: option.textColor }}>{option.label}</Box>
                </Stack>
              </MenuItem>
            ))}
          </TextField>
        );
      }}
      rules={rules}
    />
  );
}

