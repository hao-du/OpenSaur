import { Grid } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DateTimePicker } from "../../../components/atoms/DateTimePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number as NumberField } from "../../../components/atoms/Number";
import { Text } from "../../../components/atoms/Text";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";

type Props = {
  currencies: CurrencyDto[];
  initialValue?: {
    exchangeRate: number;
    exchangeDate: string;
    outCurrencyId: string;
    outAmount: number;
    inCurrencyId: string;
    inAmount: number;
    description?: string | null;
  } | null;
  submitLabel?: string;
  onSubmit: (payload: {
    exchangeRate: number;
    exchangeDate: string;
    outLeg: { currencyId: string; amount: number; description?: string };
    inLeg: { currencyId: string; amount: number; description?: string };
    description?: string;
  }) => Promise<void>;
};

type FormValues = {
  exchangeRate: string;
  exchangeDate: string;
  outCurrencyId: string;
  outAmount: string;
  inCurrencyId: string;
  inAmount: string;
  description: string;
};

export function ExchangeForm({ currencies, initialValue, submitLabel = "Create Exchange", onSubmit }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm<FormValues>({
    defaultValues: {
      description: "",
      exchangeDate: today,
      exchangeRate: "",
      inAmount: "",
      inCurrencyId: currencies[0]?.id ?? "",
      outAmount: "",
      outCurrencyId: currencies[0]?.id ?? ""
    }
  });

  useEffect(() => {
    if (initialValue == null) {
      form.reset({
        description: "",
        exchangeDate: today,
        exchangeRate: "",
        inAmount: "",
        inCurrencyId: currencies[0]?.id ?? "",
        outAmount: "",
        outCurrencyId: currencies[0]?.id ?? ""
      });
      return;
    }

    form.reset({
      description: initialValue.description ?? "",
      exchangeDate: initialValue.exchangeDate,
      exchangeRate: initialValue.exchangeRate.toString(),
      inAmount: initialValue.inAmount.toString(),
      inCurrencyId: initialValue.inCurrencyId,
      outAmount: initialValue.outAmount.toString(),
      outCurrencyId: initialValue.outCurrencyId
    });
  }, [currencies, form, initialValue, today]);

  const currencyOptions = currencies.map(x => ({ label: x.shortName, value: x.id }));

  return (
    <Grid container spacing={2} component="form" noValidate onSubmit={form.handleSubmit(async values => {
      await onSubmit({
        description: values.description.trim().length === 0 ? undefined : values.description.trim(),
        exchangeDate: values.exchangeDate,
        exchangeRate: Number(values.exchangeRate),
        inLeg: { amount: Number(values.inAmount), currencyId: values.inCurrencyId },
        outLeg: { amount: Number(values.outAmount), currencyId: values.outCurrencyId }
      });
    })}>
      <Grid size={{ xs: 12, md: 2 }}>
        <NumberField
          control={form.control}
          label="Exchange Rate"
          name="exchangeRate"
          required
          rules={{ required: "Exchange Rate is required." }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <DropDown
          control={form.control}
          label="Out Currency"
          name="outCurrencyId"
          options={currencyOptions}
          required
          rules={{ required: "Out Currency is required." }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <NumberField
          control={form.control}
          label="Out Amount"
          name="outAmount"
          required
          rules={{ required: "Out Amount is required." }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <DropDown
          control={form.control}
          label="In Currency"
          name="inCurrencyId"
          options={currencyOptions}
          required
          rules={{ required: "In Currency is required." }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <NumberField
          control={form.control}
          label="In Amount"
          name="inAmount"
          required
          rules={{ required: "In Amount is required." }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <ActionButton sx={{ height: "100%" }} fullWidth type="submit">
          {submitLabel}
        </ActionButton>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <DateTimePicker
          control={form.control}
          label="Exchange Date"
          name="exchangeDate"
          required
          rules={{ required: "Exchange Date is required." }}
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

