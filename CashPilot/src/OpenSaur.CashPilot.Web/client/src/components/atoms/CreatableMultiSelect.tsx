import { Autocomplete, Box, Chip, Stack, TextField } from "@mui/material";
import type { ReactNode } from "react";
import { useMemo, useRef } from "react";
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from "react-hook-form";

type CreatableMultiSelectProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  icon?: ReactNode;
  helperText?: string;
  label: string;
  name: FieldPath<TFieldValues>;
  onCreateOption?: (value: string) => Promise<void> | void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

const normalize = (value: string) => value.trim().toLowerCase();

const toCanonicalValue = (
  value: unknown,
  optionLookup: Map<string, string>,
): string | null => {
  const trimmed = String(value ?? "").trim();
  if (trimmed.length === 0) {
    return null;
  }

  return optionLookup.get(normalize(trimmed)) ?? trimmed;
};

const toCanonicalValues = (
  values: unknown[],
  optionLookup: Map<string, string>,
): string[] => Array.from(
  new Set(
    values
      .map((value) => toCanonicalValue(value, optionLookup))
      .filter((value): value is string => value != null),
  ),
);

export function CreatableMultiSelect<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  icon,
  helperText,
  label,
  name,
  onCreateOption,
  options,
  placeholder,
  required = false,
  rules,
}: CreatableMultiSelectProps<TFieldValues>) {
  const createdOptionNamesRef = useRef(new Set<string>());
  const canonicalOptions = useMemo(
    () =>
      Array.from(
        new Map(
          options
            .map((option) => option.trim())
            .filter((option) => option.length > 0)
            .map((option) => [normalize(option), option] as const),
        ).values(),
      ).sort((a, b) => a.localeCompare(b)),
    [options],
  );
  const optionLookup = useMemo(
    () => new Map(canonicalOptions.map((option) => [normalize(option), option] as const)),
    [canonicalOptions],
  );
  const existingNames = useMemo(
    () => new Set(canonicalOptions.map((option) => normalize(option))),
    [canonicalOptions],
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedValues = Array.isArray(field.value) ? field.value : [];
        const canonicalValues = toCanonicalValues(selectedValues, optionLookup);

        const commitPendingInput = (pendingValue: string) => {
          const pendingCanonicalValue = toCanonicalValue(pendingValue, optionLookup);
          if (pendingCanonicalValue == null) {
            return;
          }

          const nextValues = toCanonicalValues([...canonicalValues, pendingCanonicalValue], optionLookup);
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

              if (input.length > 0 && !existingNames.has(normalize(input))) {
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
                .map((value) => optionLookup.get(normalize(value)) ?? value);

              const uniqueValues = Array.from(new Set(normalized));
              field.onChange(uniqueValues);

              if (onCreateOption == null) {
                return;
              }

              const missingValues = uniqueValues.filter(
                (value) =>
                  !existingNames.has(normalize(value)) &&
                  !createdOptionNamesRef.current.has(normalize(value)),
              );

              if (missingValues.length === 0) {
                return;
              }

              missingValues.forEach((value) => {
                createdOptionNamesRef.current.add(normalize(value));
              });

              void Promise.all(
                missingValues.map((value) =>
                  Promise.resolve(onCreateOption(value)).catch(() => undefined),
                ),
              );
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
