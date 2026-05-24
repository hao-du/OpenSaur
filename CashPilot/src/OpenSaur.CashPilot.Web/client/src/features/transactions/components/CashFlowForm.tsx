import { Stack } from "@mui/material";
import type { Control } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number } from "../../../components/atoms/Number";
import { TextArea } from "../../../components/atoms/TextArea";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";

export type CashFlowFormValues = {
  amount: string;
  currencyId: string;
  description: string;
  direction: string;
  transactionDate: string;
};

type CashFlowFormProps = {
  control: Control<CashFlowFormValues>;
  currencyOptions: Array<{ label: string; value: string }>;
  isEditMode: boolean;
  isSubmitting: boolean;
};

export function CashFlowForm({ control, currencyOptions, isEditMode, isSubmitting }: CashFlowFormProps) {
  const { t } = useSettings();
  return (
    <Stack spacing={2} sx={layoutStyles.drawerBody}>
      <Number
        control={control}
        disabled={isSubmitting}
        label={t("transactions.amount")}
        name="amount"
        required
        rules={{
          required: t("transactions.validation.amountRequired")
        }}
      />
      <DropDown
        control={control}
        disabled={isSubmitting}
        label={t("transactions.currency")}
        name="currencyId"
        options={currencyOptions}
        required
        rules={{
          required: t("transactions.validation.currencyRequired")
        }}
      />
      <DropDown
        control={control}
        disabled={isSubmitting}
        label={t("transactions.direction")}
        name="direction"
        options={[
          { label: t("transactions.directionIn"), value: "1" },
          { label: t("transactions.directionOut"), value: "2" }
        ]}
        required
        rules={{
          required: t("transactions.validation.directionRequired")
        }}
      />
      <DatePicker
        control={control}
        disabled={isSubmitting}
        label={t("transactions.date")}
        name="transactionDate"
        required
        rules={{
          required: t("transactions.validation.dateRequired")
        }}
      />
      <TextArea
        control={control}
        disabled={isSubmitting}
        label={t("transactions.description")}
        minRows={3}
        name="description"
      />
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={layoutStyles.formFooterRow}>
        <ActionButton disabled={isSubmitting} type="submit">
          {isSubmitting ? t("action.working") : isEditMode ? t("transactions.save") : t("transactions.create")}
        </ActionButton>
      </Stack>
    </Stack>
  );
}

