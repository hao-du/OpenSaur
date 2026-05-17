import { Button, Stack, TextField } from "@mui/material";
import { DateTimePicker } from "../../../components/atoms/DateTimePicker";
import { useState } from "react";

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

export const formatDisplayValue = (value: string | number) => {
  if (value === "" || value === undefined || value === null) return "";
  const stringValue = value.toString();
  const rawValue = stringValue.replace(/,/g, "");
  const num = parseFloat(rawValue);
  if (isNaN(num)) return stringValue;

  const parts = rawValue.split(".");
  const formatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const formattedInt = formatter.format(parseInt(parts[0] || "0"));
  if (parts.length > 1) {
    return `${formattedInt}.${parts[1]}`;
  }
  return formattedInt;
};

export const handleNumberChange = (val: string, onChange: (v: string) => void) => {
  const rawValue = val.replace(/,/g, "");
  if (/^\d*\.?\d*$/.test(rawValue)) {
    onChange(rawValue);
  }
};

type Props = {
  detail: DetailEditor;
  onAccept: (detail: DetailEditor) => void;
  onDelete: () => void;
  onCancelNew: () => void;
};

export function BankAccountTransactionForm({
  detail,
  onAccept,
  onDelete,
  onCancelNew
}: Props) {
  const [isEditing, setIsEditing] = useState(detail.isNew || false);
  const [draft, setDraft] = useState<DetailEditor>(detail);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAccept = () => {
    const nextErrors: Record<string, string> = {};
    if (draft.amount.trim().length === 0) nextErrors.amount = "Amount is required.";
    else if (!Number.isFinite(Number(draft.amount))) nextErrors.amount = "Amount is invalid.";
    if (draft.transactionDate.trim().length === 0) nextErrors.transactionDate = "Date is required.";
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

  const typeText = draft.transactionType === "1" ? "InitialDeposit" : draft.transactionType === "2" ? "InterestPayment" : "PrincipalReturn";

  if (!isEditing) {
    return (
      <Stack spacing={2} sx={{ p: 2, border: "1px solid #eee", borderRadius: 1 }}>
        <Stack spacing={1}>
          <span><strong>Date:</strong> {draft.transactionDate}</span>
          <span><strong>Amount:</strong> {formatDisplayValue(draft.amount)}</span>
          <span><strong>Type:</strong> {typeText}</span>
          {draft.description && <span><strong>Description:</strong> {draft.description}</span>}
        </Stack>
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button onClick={() => setIsEditing(true)} size="small" variant="outlined">Edit</Button>
          <Button color="error" onClick={onDelete} size="small" variant="outlined">Delete</Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fafafa' }}>
      <TextField 
        required
        label="Amount" 
        value={formatDisplayValue(draft.amount)} 
        onChange={e => handleNumberChange(e.target.value, val => setDraft({ ...draft, amount: val }))} 
        error={errors.amount != null}
        helperText={errors.amount}
        fullWidth 
        autoComplete="off"
        inputMode="decimal"
      />
      <DateTimePicker required label="Date" value={draft.transactionDate} onChange={value => setDraft({ ...draft, transactionDate: value })} error={errors.transactionDate != null} helperText={errors.transactionDate} />
      <TextField label="Description" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} multiline minRows={3} fullWidth />
      
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1 }}>
        <Button onClick={handleCancel} variant="outlined">Cancel</Button>
        <Button onClick={handleAccept} variant="contained" color="primary">Accept</Button>
      </Stack>
    </Stack>
  );
}

