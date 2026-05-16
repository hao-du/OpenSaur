import { Button, Stack } from "@mui/material";
import { DateTimePicker } from "../../../components/atoms/DateTimePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number as NumberField } from "../../../components/atoms/Number";
import { TextArea } from "../../../components/atoms/TextArea";
import { useForm } from "react-hook-form";
import { useState } from "react";

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

  const directionText = detail.direction === "1" ? "In" : "Out";
  if (!isEditing) {
    return (
      <Stack spacing={1.25} sx={{ p: 2, border: "1px solid #eee", borderRadius: 1 }}>
        <span><strong>Date:</strong> {detail.transactionDate}</span>
        <span><strong>Amount:</strong> {detail.amount}</span>
        <span><strong>Direction:</strong> {directionText}</span>
        {detail.description.length > 0 ? <span><strong>Description:</strong> {detail.description}</span> : null}
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button size="small" variant="outlined" onClick={startEdit}>Edit</Button>
          <Button size="small" variant="outlined" color="error" onClick={onDelete}>Delete</Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 1, bgcolor: "#fafafa" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Stack sx={{ flex: 2 }}>
          <NumberField
            control={form.control}
            disabled={isSubmitting}
            label="Amount"
            name="amount"
            required
            rules={{ required: "Amount is required." }}
          />
        </Stack>
        <Stack sx={{ flex: 1 }}>
          <DropDown
            control={form.control}
            disabled={isSubmitting}
            label="Direction"
            name="direction"
            options={[
              { label: "In", value: "1" },
              { label: "Out", value: "2" }
            ]}
            required
            rules={{ required: "Direction is required." }}
          />
        </Stack>
      </Stack>
      <DateTimePicker
        control={form.control}
        disabled={isSubmitting}
        label="Date"
        name="transactionDate"
        required
        rules={{ required: "Date is required." }}
      />
      <TextArea control={form.control} disabled={isSubmitting} label="Description" name="description" minRows={3} />
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button variant="outlined" onClick={cancelEdit} disabled={isSubmitting}>Cancel</Button>
        <Button variant="contained" disabled={isSubmitting} onClick={() => {
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
        }}>Accept</Button>
      </Stack>
    </Stack>
  );
}
