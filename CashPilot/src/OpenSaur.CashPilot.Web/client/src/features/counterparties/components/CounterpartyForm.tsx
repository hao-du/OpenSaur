import { Stack } from "@mui/material";
import type { Control } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";

export type CounterpartyFormValues = {
  fullName: string;
  email: string;
  phoneNumber: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
};

type CounterpartyFormProps = {
  control: Control<CounterpartyFormValues>;
  isEditMode: boolean;
  isSubmitting: boolean;
};

export function CounterpartyForm({
  control,
  isEditMode,
  isSubmitting
}: CounterpartyFormProps) {
  const { t } = useSettings();

  return (
    <Stack spacing={2} sx={layoutStyles.drawerBody}>
      <Text
        control={control}
        disabled={isSubmitting}
        label={t("counterparties.fullName")}
        name="fullName"
        required
        rules={{
          required: t("counterparties.validation.fullNameRequired"),
          validate: value => typeof value === "string" && value.trim().length > 0 ? true : t("counterparties.validation.fullNameRequired")
        }}
      />
      <Text
        control={control}
        disabled={isSubmitting}
        label={t("counterparties.email")}
        name="email"
        rules={{
          pattern: {
            message: t("counterparties.validation.invalidEmail"),
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          }
        }}
      />
      <Text
        control={control}
        disabled={isSubmitting}
        label={t("counterparties.phoneNumber")}
        name="phoneNumber"
        rules={{
          pattern: {
            message: t("counterparties.validation.invalidPhoneNumber"),
            value: /^[0-9+\-() ]+$/
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
      {isEditMode ? (
        <CheckBox
          control={control}
          disabled={isSubmitting}
          label={t("counterparties.active")}
          name="isActive"
        />
      ) : null}
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={layoutStyles.formFooterRow}>
        <ActionButton disabled={isSubmitting} type="submit">
          {isSubmitting ? t("action.working") : isEditMode ? t("common.save") : t("common.create")}
        </ActionButton>
      </Stack>
    </Stack>
  );
}

