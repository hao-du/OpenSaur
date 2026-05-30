import { Stack } from "@mui/material";
import type { Control } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import { layoutStyles } from "../../../infrastructure/theme/theme";
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
  submitLabel: string;
};

export function BankForm({
  control,
  isSubmitting,
  submitLabel
}: BankFormProps) {
  const { t } = useSettings();
  return (
    <Stack spacing={2} sx={layoutStyles.drawerBody}>
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
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={layoutStyles.formFooterRow}>
        <ActionButton disabled={isSubmitting} type="submit">
          {isSubmitting ? t("action.working") : submitLabel}
        </ActionButton>
      </Stack>
    </Stack>
  );
}

