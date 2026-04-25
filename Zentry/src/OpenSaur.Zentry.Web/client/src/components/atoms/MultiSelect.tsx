import { Autocomplete, Checkbox, Chip, Stack, TextField, Typography } from "@mui/material";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";

export type MultiSelectOption = {
  description?: string;
  label: string;
  value: string;
};

type MultiSelectProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  helperText?: string;
  label: string;
  name: FieldPath<TFieldValues>;
  options: MultiSelectOption[];
  placeholder?: string;
  required?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

export function MultiSelect<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  helperText,
  label,
  name,
  options,
  placeholder,
  required = false,
  rules
}: MultiSelectProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedValues = new Set<string>(Array.isArray(field.value) ? field.value : []);
        const selectedOptions = options.filter(option => selectedValues.has(option.value));

        return (
          <Autocomplete
            disableCloseOnSelect
            disabled={disabled}
            getOptionLabel={option => option.label}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            multiple
            onChange={(_, nextOptions) => {
              field.onChange(nextOptions.map(option => option.value));
            }}
            options={options}
            renderInput={params => (
              <TextField
                {...params}
                error={fieldState.error != null}
                fullWidth
                helperText={fieldState.error?.message ?? helperText}
                label={label}
                placeholder={placeholder}
                required={required}
                sx={{
                  "& .MuiAutocomplete-input": {
                    flexBasis: "100%",
                    minWidth: "100% !important"
                  }
                }}
              />
            )}
            renderOption={(props, option, { selected }) => {
              const { key, ...optionProps } = props;

              return (
                <li {...optionProps} key={key}>
                  <Checkbox checked={selected} sx={{ mr: 1 }} />
                  <Stack spacing={0.25}>
                    <Typography>{option.label}</Typography>
                    {option.description ? (
                      <Typography color="text.secondary" variant="body2">
                        {option.description}
                      </Typography>
                    ) : null}
                  </Stack>
                </li>
              );
            }}
            renderTags={(selectedTagOptions, getTagProps) => (
              selectedTagOptions.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });

                return (
                  <Chip
                    {...tagProps}
                    key={key}
                    label={option.label}
                    size="small"
                  />
                );
              })
            )}
            value={selectedOptions}
          />
        );
      }}
      rules={rules}
    />
  );
}
