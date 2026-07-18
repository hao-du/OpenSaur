import { Stack } from "@mui/material";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { FormSection } from "../../../components/atoms/FormSection";
import { Number as NumberField } from "../../../components/atoms/Number";
import { TextArea } from "../../../components/atoms/TextArea";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { formatAmount } from "../../../infrastructure/constants/numberFormatters";
import { transactionDirections } from "../../../infrastructure/constants/transactionEnums";
import { useSettings } from "../../settings/provider/SettingProvider";

export type TransferDetailEditor = {
  clientKey: string;
  id?: string;
  amount: string;
  direction: string;
  transactionDate: string;
  description: string;
  isActive?: boolean;
  isNew?: boolean;
};

type Props = {
  detail: TransferDetailEditor;
  isSubmitting?: boolean;
  onAccept: (detail: TransferDetailEditor) => void;
  onDelete: () => void;
  onCancelNew: () => void;
};

type FormValues = {
  amount: string;
  direction: string;
  transactionDate: string;
  description: string;
};

export function TransferFormTransaction({ detail, isSubmitting = false, onAccept, onDelete, onCancelNew }: Props) {
  const { formatDate, locale, t } = useSettings();
  const [isEditing, setIsEditing] = useState(detail.isNew || false);
  const form = useForm<FormValues>({
    defaultValues: {
      amount: detail.amount,
      description: detail.description,
      direction: detail.direction,
      transactionDate: detail.transactionDate
    }
  });

  function startEdit() {
    form.reset({
      amount: detail.amount,
      description: detail.description,
      direction: detail.direction,
      transactionDate: detail.transactionDate
    });
    setIsEditing(true);
  }

  function cancelEdit() {
    if (detail.isNew) {
      onCancelNew();
      return;
    }
    setIsEditing(false);
  }

  const directionText = detail.direction === "1" ? t("transactions.directionIn") : t("transactions.directionOut");
  const formattedAmount = Number.isFinite(Number(detail.amount))
    ? formatAmount(Number(detail.amount), locale)
    : detail.amount;
  if (!isEditing) {
    return (
      <FormSection>
        <span><strong>{t("transactions.date")}:</strong> {formatDate(detail.transactionDate)}</span>
        <span><strong>{t("transactions.amount")}:</strong> {formattedAmount}</span>
        <span><strong>{t("transactions.direction")}:</strong> {directionText}</span>
        {detail.description.length > 0 ? <span><strong>{t("transactions.description")}:</strong> {detail.description}</span> : null}
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <ActionButton size="small" variant="outlined" onClick={startEdit}>{t("transactions.edit")}</ActionButton>
          <ActionButton size="small" variant="outlined" color="error" onClick={onDelete}>{t("transactions.delete")}</ActionButton>
        </Stack>
      </FormSection>
    );
  }

  return (
    <FormSection>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Stack sx={{ flex: 2 }}>
          <NumberField
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.amount")}
            name="amount"
            required
            rules={{ required: t("transactions.validation.amountRequired") }}
          />
        </Stack>
        <Stack sx={{ flex: 1 }}>
          <DropDown
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.direction")}
            name="direction"
            options={[
              { label: t("transactions.directionIn"), value: transactionDirections.inflow },
              { label: t("transactions.directionOut"), value: transactionDirections.outflow }
            ]}
            required
            rules={{ required: t("transactions.validation.directionRequired") }}
          />
        </Stack>
      </Stack>
      <DatePicker
        control={form.control}
        disabled={isSubmitting}
        label={t("transactions.date")}
        name="transactionDate"
        required
        rules={{ required: t("transactions.validation.dateRequired") }}
      />
      <TextArea control={form.control} disabled={isSubmitting} label={t("transactions.description")} name="description" minRows={3} />
      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        <ActionButton variant="outlined" onClick={cancelEdit} disabled={isSubmitting}>{t("action.cancel")}</ActionButton>
        <ActionButton variant="contained" disabled={isSubmitting} onClick={() => {
          void form.handleSubmit(values => {
            onAccept({
              ...detail,
              amount: values.amount,
              description: values.description,
              direction: values.direction,
              transactionDate: values.transactionDate,
              isNew: false
            });
            setIsEditing(false);
          })();
        }}>{t("action.confirm")}</ActionButton>
      </Stack>
    </FormSection>
  );
}
