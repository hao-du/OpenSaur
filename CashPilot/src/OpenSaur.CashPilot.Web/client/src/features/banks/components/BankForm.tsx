import { Stack } from "@mui/material";
import type { Control } from "react-hook-form";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import { useSettings } from "../../settings/provider/SettingProvider";

export type BankFormValues = {
  name: string;
  shortName: string;
  description: string;
  isDefault: boolean;
};

type BankFormProps = {
  control: Control<BankFormValues>;
  isSubmitting: boolean;
};

export function BankForm({
  control,
  isSubmitting,
}: BankFormProps) {
  const { t } = useSettings();
  return (
    <Stack spacing={2}>
      <Text
        control={control}
        disabled={isSubmitting}
        label={t("common.name")}
        name="name"
        required
        rules={{
          required: t("banks.validation.nameRequired"),
          validate: value => typeof value === "string" && value.trim().length > 0 ? true : t("banks.validation.nameRequired")
        }}
      />
      <Text
        control={control}
        disabled={isSubmitting}
        helperText={t("banks.shortNameHint")}
        label={t("banks.shortName")}
        name="shortName"
        required
        rules={{
          required: t("banks.validation.shortNameRequired"),
          validate: value => typeof value === "string" && value.trim().length > 0 ? true : t("banks.validation.shortNameRequired")
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

