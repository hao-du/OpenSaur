import { Grid } from "@mui/material";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DateTimePicker } from "../../../components/atoms/DateTimePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number as NumberField } from "../../../components/atoms/Number";
import { Text } from "../../../components/atoms/Text";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";

type Props = {
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  onSubmit: (payload: {
    counterpartyId: string;
    transferType: number;
    currencyId: string;
    amount: number;
    transactionDate: string;
    dueDate?: string;
    description?: string;
  }) => Promise<void>;
};

type FormValues = {
  counterpartyId: string;
  transferType: string;
  currencyId: string;
  amount: string;
  transactionDate: string;
  dueDate: string;
  description: string;
};

export function TransferHeaderForm({ counterparties, currencies, onSubmit }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm<FormValues>({
    defaultValues: {
      amount: "",
      counterpartyId: counterparties[0]?.id ?? "",
      currencyId: currencies[0]?.id ?? "",
      description: "",
      dueDate: "",
      transactionDate: today,
      transferType: "1"
    }
  });

  return (
    <Grid container spacing={2} component="form" noValidate onSubmit={form.handleSubmit(async values => {
      await onSubmit({
        amount: Number(values.amount),
        counterpartyId: values.counterpartyId,
        currencyId: values.currencyId,
        description: values.description.trim().length === 0 ? undefined : values.description.trim(),
        dueDate: values.dueDate.trim().length === 0 ? undefined : values.dueDate,
        transactionDate: values.transactionDate,
        transferType: Number(values.transferType)
      });
    })}>
      <Grid size={{ xs: 12, md: 3 }}>
        <DropDown
          control={form.control}
          label="Counterparty"
          name="counterpartyId"
          options={counterparties.map(x => ({ label: x.fullName, value: x.id }))}
          required
          rules={{ required: "Counterparty is required." }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <DropDown
          control={form.control}
          label="Type"
          name="transferType"
          options={[
            { label: "Lend", value: "1" },
            { label: "Borrow", value: "2" },
            { label: "Give", value: "3" },
            { label: "Receive", value: "4" }
          ]}
          required
          rules={{ required: "Type is required." }}
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
      <Grid size={{ xs: 12, md: 3 }}>
        <ActionButton sx={{ height: "100%" }} fullWidth type="submit">
          Create Transfer
        </ActionButton>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <DateTimePicker
          control={form.control}
          label="Transaction Date"
          name="transactionDate"
          required
          rules={{ required: "Transaction Date is required." }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <DateTimePicker
          control={form.control}
          label="Due Date"
          name="dueDate"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Text
          control={form.control}
          label="Description"
          name="description"
        />
      </Grid>
    </Grid>
  );
}

