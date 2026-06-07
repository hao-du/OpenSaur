import { Autocomplete, Box, Chip, Stack, TextField } from "@mui/material";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";
import {
  buildCanonicalMultiSelectOptions,
  mergeCanonicalMultiSelectValues,
  normalizeMultiSelectValue,
  toCanonicalMultiSelectValues,
} from "./creatableMultiSelectUtils";

type CreatableMultiSelectProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  icon?: ReactNode;
  helperText?: string;
  label: string;
  name: FieldPath<TFieldValues>;
  options: string[];
  placeholder?: string;
  required?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

export function CreatableMultiSelect<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  icon,
  helperText,
  label,
  name,
  options,
  placeholder,
  required = false,
  rules,
}: CreatableMultiSelectProps<TFieldValues>) {
  const canonicalOptions = useMemo(() => buildCanonicalMultiSelectOptions(options), [options]);
  const optionLookup = useMemo(
    () =>
      new Map(
        canonicalOptions.map((option) => [
          normalizeMultiSelectValue(option),
          option,
        ] as const),
      ),
    [canonicalOptions],
  );
  const existingNames = useMemo(
    () =>
      new Set(canonicalOptions.map((option) => normalizeMultiSelectValue(option))),
    [canonicalOptions],
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedValues = Array.isArray(field.value) ? field.value : [];
        const canonicalValues = toCanonicalMultiSelectValues(selectedValues, optionLookup);

        const commitPendingInput = (pendingValue: string) => {
          const nextValues = mergeCanonicalMultiSelectValues(
            canonicalValues,
            pendingValue,
            optionLookup,
          );
          if (nextValues.length === canonicalValues.length && nextValues.every((value, index) => value === canonicalValues[index])) {
            return;
          }

          field.onChange(nextValues);
        };

        return (
          <Autocomplete
            clearOnBlur
            disabled={disabled}
            filterOptions={(availableOptions, params) => {
              const input = params.inputValue.trim();
              const filtered = availableOptions.filter((option) =>
                option.toLowerCase().includes(input.toLowerCase()),
              );

              if (
                input.length > 0 &&
                !existingNames.has(normalizeMultiSelectValue(input))
              ) {
                filtered.push(input);
              }

              return filtered;
            }}
            filterSelectedOptions
            freeSolo
            handleHomeEndKeys
            multiple
            options={canonicalOptions}
            onChange={(_, nextValues) => {
              const normalized = nextValues
                .map((value) => String(value ?? "").trim())
                .filter((value) => value.length > 0)
                .map((value) =>
                  optionLookup.get(normalizeMultiSelectValue(value)) ?? value,
                );

              const uniqueValues = Array.from(new Set(normalized));
              field.onChange(uniqueValues);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                error={fieldState.error != null}
                fullWidth
                helperText={fieldState.error?.message ?? helperText}
                label={label}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: icon ? (
                    <Stack alignItems="center" direction="row" spacing={1}>
                      <Box sx={{ display: "inline-flex", color: "text.secondary" }}>{icon}</Box>
                      {params.InputProps.startAdornment}
                    </Stack>
                  ) : params.InputProps.startAdornment,
                }}
                onBlur={(event) => {
                  params.inputProps.onBlur?.(event as React.FocusEvent<HTMLInputElement>);
                  commitPendingInput((event.target as HTMLInputElement).value);
                }}
                placeholder={placeholder}
                required={required}
                sx={{
                  "& .MuiAutocomplete-input": {
                    flexBasis: "100%",
                    minWidth: "100% !important",
                  },
                }}
              />
            )}
            renderTags={(selectedTagOptions, getTagProps) =>
              selectedTagOptions.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });

                return (
                  <Chip
                    {...tagProps}
                    key={key}
                    label={option}
                    size="small"
                  />
                );
              })
            }
            selectOnFocus
            value={canonicalValues}
          />
        );
      }}
      rules={rules}
    />
  );
}
