import { Stack, TextField } from "@mui/material";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { FormSection } from "../../../components/atoms/FormSection";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { useState } from "react";
import { useSettings } from "../../settings/provider/SettingProvider";
import { formatInputNumberValue } from "../../../infrastructure/constants/numberFormatters";
import { bankAccountTransactionTypes } from "../../../infrastructure/constants/transactionEnums";

export type DetailEditor = {
  clientKey: string;
  id?: string;
  currencyId: string;
  amount: string;
  direction: string;
  transactionType: string;
  transactionDate: string;
  description: string;
  isActive: boolean;
  isNew?: boolean;
};

const handleNumberChange = (val: string, onChange: (v: string) => void) => {
  const rawValue = val.replace(/,/g, "");
  if (/^\d*\.?\d*$/.test(rawValue)) {
    onChange(rawValue);
  }
};

type Props = {
  detail: DetailEditor;
  disabled?: boolean;
  onAccept: (detail: DetailEditor) => void;
  onDelete: () => void;
  onCancelNew: () => void;
};

export function BankAccountTransactionForm({
  detail,
  disabled = false,
  onAccept,
  onDelete,
  onCancelNew
}: Props) {
  const { formatDate, t } = useSettings();
  const [isEditing, setIsEditing] = useState(detail.isNew || false);
  const [draft, setDraft] = useState<DetailEditor>(detail);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAccept = () => {
    const nextErrors: Record<string, string> = {};
    if (draft.amount.trim().length === 0) nextErrors.amount = t("transactions.validation.amountRequired");
    else if (!Number.isFinite(Number(draft.amount))) nextErrors.amount = t("transactions.validation.amountInvalid");
    if (draft.transactionDate.trim().length === 0) nextErrors.transactionDate = t("transactions.validation.dateRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onAccept({ ...draft, isNew: false });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (detail.isNew) {
      onCancelNew();
    } else {
      setDraft(detail);
      setIsEditing(false);
    }
  };

  const typeText = draft.transactionType === String(bankAccountTransactionTypes.initialDeposit)
    ? t("transactions.initialDeposit")
    : draft.transactionType === String(bankAccountTransactionTypes.interestPayment)
      ? t("transactions.interestPayment")
      : t("transactions.principalReturn");

  if (!isEditing) {
    return (
      <FormSection>
        <Stack spacing={1}>
          <span><strong>{t("transactions.date")}:</strong> {formatDate(draft.transactionDate)}</span>
          <span><strong>{t("transactions.amount")}:</strong> {formatInputNumberValue(draft.amount)}</span>
          <span><strong>{t("transactions.type")}:</strong> {typeText}</span>
          {draft.description && <span><strong>{t("transactions.description")}:</strong> {draft.description}</span>}
        </Stack>
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <ActionButton onClick={() => setIsEditing(true)} size="small" variant="outlined">{t("transactions.edit")}</ActionButton>
          <ActionButton color="error" onClick={onDelete} size="small" variant="outlined">{t("transactions.delete")}</ActionButton>
        </Stack>
      </FormSection>
    );
  }

  return (
    <FormSection>
      <TextField 
        required
        label={t("transactions.amount")}
        value={formatInputNumberValue(draft.amount)} 
        onChange={e => handleNumberChange(e.target.value, val => setDraft({ ...draft, amount: val }))} 
        error={errors.amount != null}
        helperText={errors.amount}
        fullWidth 
        autoComplete="off"
        inputMode="decimal"
      />
      <DatePicker required label={t("transactions.date")} value={draft.transactionDate} onChange={value => setDraft({ ...draft, transactionDate: value })} error={errors.transactionDate != null} helperText={errors.transactionDate} />
      <TextField label={t("transactions.description")} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} multiline minRows={3} fullWidth />
      
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1 }}>
        <ActionButton onClick={handleCancel} variant="outlined" disabled={disabled}>{t("action.cancel")}</ActionButton>
        <ActionButton onClick={handleAccept} variant="contained" color="primary" disabled={disabled}>{t("action.confirm")}</ActionButton>
      </Stack>
    </FormSection>
  );
}

