import { Stack } from "@mui/material";
import type { Control } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { MultiSelect } from "../../../components/atoms/MultiSelect";
import { Text } from "../../../components/atoms/Text";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";

export type TagFormValues = {
  name: string;
  matchingTerms: string[];
};

type TagFormProps = {
  control: Control<TagFormValues>;
  isSubmitting: boolean;
  submitLabel: string;
};

export function TagForm({ control, isSubmitting, submitLabel }: TagFormProps) {
  const { t } = useSettings();
  return (
    <Stack spacing={2} sx={layoutStyles.drawerBody}>
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
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={layoutStyles.formFooterRow}>
        <ActionButton disabled={isSubmitting} type="submit">
          {isSubmitting ? t("action.working") : submitLabel}
        </ActionButton>
      </Stack>
    </Stack>
  );
}
