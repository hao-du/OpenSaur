import { Autocomplete, Box, MenuItem, Stack, TextField } from "@mui/material";
import type { ReactNode } from "react";
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
          const selectedOption = options.find(option => option.value === field.value) ?? null;

          return (
            <Autocomplete
              disabled={disabled}
              getOptionLabel={option => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              onChange={(_, nextOption) => field.onChange(nextOption?.value ?? "")}
              options={options}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props;

                return (
                  <li {...optionProps} key={key}>
                    <Stack alignItems="center" direction="row" spacing={1}>
                      {option.icon ? <Box sx={{ color: option.textColor }}>{option.icon}</Box> : null}
                      <Box sx={{ color: option.textColor }}>{option.label}</Box>
                    </Stack>
                  </li>
                );
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  error={fieldState.error != null}
                  fullWidth
                  helperText={fieldState.error?.message ?? helperText}
                  InputLabelProps={{
                    sx: { "& .MuiFormLabel-asterisk": { color: "error.main" } }
                  }}
                  label={required ? `${label} *` : label}
                  placeholder={placeholder}
                  slotProps={{
                    formHelperText: { sx: { ml: 0 } }
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: selectedOption?.icon ? (
                      <Stack alignItems="center" direction="row" spacing={0.75}>
                        <Box sx={{ color: selectedOption.textColor, display: "inline-flex" }}>
                          {selectedOption.icon}
                        </Box>
                        {params.InputProps.startAdornment}
                      </Stack>
                    ) : params.InputProps.startAdornment
                  }}
                />
              )}
              value={selectedOption}
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
            InputLabelProps={{
              sx: { "& .MuiFormLabel-asterisk": { color: "error.main" } }
            }}
            label={required ? `${label} *` : label}
            slotProps={{
              formHelperText: { sx: { ml: 0 } }
            }}
            select
          >
            {options.map(option => (
              <MenuItem key={option.value} value={option.value}>
                <Stack alignItems="center" direction="row" spacing={1}>
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

