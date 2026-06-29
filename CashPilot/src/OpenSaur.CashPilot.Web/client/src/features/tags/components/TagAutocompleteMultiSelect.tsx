import { useMemo } from "react";
import type { Control, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Tag } from "lucide-react";
import { CreatableMultiSelect } from "../../../components/atoms/CreatableMultiSelect";
import { useTagsQuery } from "../hooks/useTagsQuery";

type TagAutocompleteMultiSelectProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  disabled?: boolean;
  helperText?: string;
  label: string;
  name: FieldPath<TFieldValues>;
  placeholder?: string;
  required?: boolean;
  tagOptions?: string[];
  rules?: Omit<RegisterOptions<TFieldValues, FieldPath<TFieldValues>>, "disabled" | "valueAsDate" | "valueAsNumber" | "setValueAs">;
};

const normalizeTagName = (value: string) => value.trim().toLowerCase();

export function TagAutocompleteMultiSelect<TFieldValues extends FieldValues>({
  control,
  disabled = false,
  helperText,
  label,
  name,
  placeholder,
  required = false,
  tagOptions,
  rules,
}: TagAutocompleteMultiSelectProps<TFieldValues>) {
  const { data: tags = [] } = useTagsQuery(
    { isActive: true, name: "" },
    { enabled: tagOptions == null },
  );

  const options = useMemo(() => {
    const source = (tagOptions ?? tags.map((tag) => tag.name.trim()))
      .filter((value) => value.length > 0)
      .filter((value, index, array) => array.findIndex((item) => normalizeTagName(item) === normalizeTagName(value)) === index)
      .sort((a, b) => a.localeCompare(b));

    return source;
  }, [tagOptions, tags]);

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
