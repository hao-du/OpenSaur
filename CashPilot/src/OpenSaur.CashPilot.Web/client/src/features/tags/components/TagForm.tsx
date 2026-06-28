import { Stack } from "@mui/material";
import type { Control } from "react-hook-form";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { MultiSelect } from "../../../components/atoms/MultiSelect";
import { Text } from "../../../components/atoms/Text";
import { useSettings } from "../../settings/provider/SettingProvider";

export type TagFormValues = {
  name: string;
  matchingTerms: string[];
  marker?: boolean;
  isDefaultMaker?: boolean;
};

type TagFormProps = {
  control: Control<TagFormValues>;
  isSubmitting: boolean;
  setValue: (name: "marker" | "isDefaultMaker", value: boolean) => void;
};

export function TagForm({ control, isSubmitting, setValue }: TagFormProps) {
  const { t } = useSettings();

  return (
    <Stack spacing={2}>
      <Text
        control={control}
        disabled={isSubmitting}
        label={t("tags.name")}
        name="name"
        required
        rules={{
          required: t("tags.validation.nameRequired"),
          validate: value => typeof value === "string" && value.trim().length > 0 ? true : t("tags.validation.nameRequired")
        }}
      />
      <MultiSelect
        control={control}
        disabled={isSubmitting}
        freeSolo
        label={t("tags.matchingTerms")}
        name="matchingTerms"
        options={[]}
        placeholder={t("tags.matchingTermsPlaceholder")}
      />
      <CheckBox
        control={control}
        disabled={isSubmitting}
        label={t("tags.marker")}
        name="marker"
        onChange={checked => {
          if (!checked) {
            setValue("isDefaultMaker", false);
          }
        }}
      />
      <CheckBox
        control={control}
        disabled={isSubmitting}
        label={t("tags.isDefaultMaker")}
        name="isDefaultMaker"
        onChange={checked => {
          if (checked) {
            setValue("marker", true);
          }
        }}
      />
    </Stack>
  );
}
