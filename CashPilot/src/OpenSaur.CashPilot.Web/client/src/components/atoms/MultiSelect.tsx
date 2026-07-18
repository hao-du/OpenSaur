import { Autocomplete, Checkbox, Stack, TextField } from "@mui/material";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";
import { LabelText } from "./LabelText";
import { MetaText } from "./MetaText";

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
  freeSolo?: boolean;
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
  freeSolo = false,
  required = false,
  rules
}: MultiSelectProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedValues = new Set<string>(Array.isArray(field.value) ? field.value : []);
        const optionMap = new Map(options.map(option => [option.value, option] as const));
        const selectedOptions = Array.from(selectedValues).map(value => optionMap.get(value) ?? { label: value, value });

        return (
          <Autocomplete
            autoHighlight
            disableCloseOnSelect
            disabled={disabled}
            clearOnBlur
            freeSolo={freeSolo}
            getOptionLabel={option => typeof option === "string" ? option : option.label}
            openOnFocus
            forcePopupIcon
            isOptionEqualToValue={(option, value) => {
              const optionValue = typeof option === "string" ? option : option.value;
              const selectedValue = typeof value === "string" ? value : value.value;
              return optionValue === selectedValue;
            }}
            multiple
            onChange={(_, nextOptions) => {
              field.onChange(nextOptions.map(option => typeof option === "string" ? option : option.value));
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
                slotProps={{
                  ...params.slotProps,
                  formHelperText: { sx: { ml: 0 } }
                }}
              />
            )}
            renderOption={(props, option, { selected }) => {
              if (typeof option === "string")
              {
                return null;
              }

              const { key, ...optionProps } = props;

              return (
                <li {...optionProps} key={key}>
                  <Checkbox checked={selected} sx={{ mr: 1 }} />
                  <Stack spacing={0.25}>
                    <LabelText>{option.label}</LabelText>
                    {option.description ? (
                      <MetaText>
                        {option.description}
                      </MetaText>
                    ) : null}
                  </Stack>
                </li>
              );
            }}
            value={selectedOptions}
          />
        );
      }}
      rules={rules}
    />
  );
}
