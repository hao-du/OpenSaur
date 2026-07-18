export const normalizeMultiSelectValue = (value: string) =>
  value.trim().toLowerCase();

export const toCanonicalMultiSelectValue = (
  value: unknown,
  optionLookup: Map<string, string>,
): string | null => {
  const trimmed = String(value ?? "").trim();
  if (trimmed.length === 0) {
    return null;
  }

  return optionLookup.get(normalizeMultiSelectValue(trimmed)) ?? trimmed;
};

export const toCanonicalMultiSelectValues = (
  values: unknown[],
  optionLookup: Map<string, string>,
): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => toCanonicalMultiSelectValue(value, optionLookup))
        .filter((value): value is string => value != null),
    ),
  );

export const buildCanonicalMultiSelectOptions = (options: string[]) =>
  Array.from(
    new Map(
      options
        .map((option) => option.trim())
        .filter((option) => option.length > 0)
        .map((option) => [normalizeMultiSelectValue(option), option] as const),
    ).values(),
  ).sort((a, b) => a.localeCompare(b));

export const mergeCanonicalMultiSelectValues = (
  currentValues: string[],
  pendingValue: string,
  optionLookup: Map<string, string>,
) => {
  const pendingCanonicalValue = toCanonicalMultiSelectValue(
    pendingValue,
    optionLookup,
  );
  if (pendingCanonicalValue == null) {
    return currentValues;
  }

  return toCanonicalMultiSelectValues(
    [...currentValues, pendingCanonicalValue],
    optionLookup,
  );
};
