import { useMemo } from "react";
import type { Control, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Tag } from "lucide-react";
import { CreatableMultiSelect } from "../../../components/atoms/CreatableMultiSelect";
import { useCurrentProfileQuery } from "../../profile/hooks/useCurrentProfileQuery";
import { loadOfflineMetadataSnapshot } from "../storages/offlineMetadataStore";

type OfflineTagAutocompleteMultiSelectProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  helperText?: string;
  label: string;
  name: FieldPath<TFieldValues>;
  placeholder?: string;
  required?: boolean;
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

const normalizeTagName = (value: string) => value.trim().toLowerCase();

export function OfflineTagAutocompleteMultiSelect<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  helperText,
  label,
  name,
  placeholder,
  required = false,
  rules,
}: OfflineTagAutocompleteMultiSelectProps<TFieldValues>) {
  const { data: currentProfile } = useCurrentProfileQuery();
  const options = useMemo(() => {
    const tags = loadOfflineMetadataSnapshot(currentProfile?.id)?.tags ?? [];

    return tags
      .map((tag) => tag.name.trim())
      .filter((value, index, array) => value.length > 0 && array.findIndex((item) => normalizeTagName(item) === normalizeTagName(value)) === index)
      .sort((a, b) => a.localeCompare(b));
  }, [currentProfile?.id]);

  return (
    <CreatableMultiSelect
      control={control}
      disabled={disabled}
      icon={<Tag size={16} />}
      helperText={helperText}
      label={label}
      name={name}
      options={options}
      placeholder={placeholder}
      required={required}
      rules={rules}
    />
  );
}
