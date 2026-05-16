import { Grid } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DateTimePicker } from "../../../components/atoms/DateTimePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number as NumberField } from "../../../components/atoms/Number";
import { Text } from "../../../components/atoms/Text";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { TransferLookupDto } from "../dtos/TransactionDto";

type Props = {
  transfers: TransferLookupDto[];
  currencies: CurrencyDto[];
  initialValue?: {
    transferId: string;
    currencyId: string;
    amount: number;
    direction: number;
    transactionDate: string;
    description?: string | null;
  } | null;
  submitLabel?: string;
  onSubmit: (payload: {
    transferId: string;
    currencyId: string;
    amount: number;
    direction: number;
    transactionDate: string;
    description?: string;
  }) => Promise<void>;
};

type FormValues = {
  transferId: string;
  currencyId: string;
  amount: string;
  direction: string;
  transactionDate: string;
  description: string;
};

export function TransferMovementForm({ transfers, currencies, initialValue, submitLabel = "Add Transaction", onSubmit }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm<FormValues>({
    defaultValues: {
      amount: "",
      currencyId: currencies[0]?.id ?? "",
      description: "",
      direction: "1",
      transactionDate: today,
      transferId: transfers[0]?.id ?? ""
    }
  });

  useEffect(() => {
    if (initialValue == null) {
      form.reset({
        amount: "",
        currencyId: currencies[0]?.id ?? "",
        description: "",
        direction: "1",
        transactionDate: today,
        transferId: transfers[0]?.id ?? ""
      });
      return;
    }

    form.reset({
      amount: initialValue.amount.toString(),
      currencyId: initialValue.currencyId,
      description: initialValue.description ?? "",
      direction: initialValue.direction.toString(),
      transactionDate: initialValue.transactionDate,
      transferId: initialValue.transferId
    });
  }, [currencies, form, initialValue, today, transfers]);

  return (
    <Grid container spacing={2} component="form" noValidate onSubmit={form.handleSubmit(async values => {
      await onSubmit({
        amount: Number(values.amount),
        currencyId: values.currencyId,
        description: values.description.trim().length === 0 ? undefined : values.description.trim(),
        direction: Number(values.direction),
        transactionDate: values.transactionDate,
        transferId: values.transferId
      });
    })}>
      <Grid size={{ xs: 12, md: 4 }}>
        <DropDown
          control={form.control}
          label="Transfer"
          name="transferId"
          options={transfers.map(x => ({
            label: `${x.counterpartyName} - ${x.transferType} - ${x.amount} - ${x.status} (remaining ${x.remainingAmount})`,
            value: x.id
          }))}
          required
          rules={{ required: "Transfer is required." }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <DropDown
          control={form.control}
          label="Currency"
          name="currencyId"
          options={currencies.map(x => ({ label: x.shortName, value: x.id }))}
          required
          rules={{ required: "Currency is required." }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <NumberField
          control={form.control}
          label="Amount"
          name="amount"
          required
          rules={{ required: "Amount is required." }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <DropDown
          control={form.control}
          label="Direction"
          name="direction"
          options={[
            { label: "In", value: "1" },
            { label: "Out", value: "2" }
          ]}
          required
          rules={{ required: "Direction is required." }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <ActionButton sx={{ height: "100%" }} fullWidth variant="outlined" type="submit">
          {submitLabel}
        </ActionButton>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <DateTimePicker
          control={form.control}
          label="Date"
          name="transactionDate"
          required
          rules={{ required: "Date is required." }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 9 }}>
        <Text
          control={form.control}
          label="Description"
          name="description"
        />
      </Grid>
    </Grid>
  );
}

