import { Stack } from "@mui/material";
import type { Control } from "react-hook-form";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import { useSettings } from "../../settings/provider/SettingProvider";

export type CurrencyFormValues = {
  name: string;
  shortName: string;
  description: string;
  isDefault: boolean;
};

type CurrencyFormProps = {
  control: Control<CurrencyFormValues>;
  isSubmitting: boolean;
};

export function CurrencyForm({
  control,
  isSubmitting
}: CurrencyFormProps) {
  const { t } = useSettings();

  return (
    <Stack spacing={2}>
      <Text
        control={control}
        disabled={isSubmitting}
        label={t("currencies.name")}
        name="name"
        required
        rules={{
          required: t("currencies.validation.nameRequired"),
          validate: value => typeof value === "string" && value.trim().length > 0 ? true : t("currencies.validation.nameRequired")
        }}
      />
      <Text
        control={control}
        disabled={isSubmitting}
        helperText={t("currencies.shortCodeHint")}
        label={t("currencies.shortCode")}
        name="shortName"
        required
        rules={{
          required: t("currencies.validation.shortCodeRequired"),
          validate: value => {
            if (typeof value !== "string" || value.trim().length === 0) {
              return t("currencies.validation.shortCodeRequired");
            }

            const length = value.trim().length;
            return length >= 3 && length <= 4 ? true : t("currencies.validation.shortCodeLength");
          }
        }}
      />
      <TextArea
        control={control}
        disabled={isSubmitting}
        label={t("common.description")}
        minRows={3}
        name="description"
      />
      <CheckBox
        control={control}
        disabled={isSubmitting}
        label={t("common.isDefault")}
        name="isDefault"
      />
    </Stack>
  );
}

