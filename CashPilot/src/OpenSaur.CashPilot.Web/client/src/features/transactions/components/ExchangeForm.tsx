import { Grid, Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number as NumberField } from "../../../components/atoms/Number";
import { TextArea } from "../../../components/atoms/TextArea";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import { useSettings } from "../../settings/provider/SettingProvider";

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
  isSubmitting?: boolean;
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

export function ExchangeForm({ currencies, initialValue, submitLabel = "Create Exchange", isSubmitting = false, onSubmit }: Props) {
  const { t } = useSettings();
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
    <Stack spacing={3}>
      <Grid container spacing={2} component="form" noValidate onSubmit={form.handleSubmit(async values => {
        await onSubmit({
          description: values.description.trim().length === 0 ? undefined : values.description.trim(),
          exchangeDate: values.exchangeDate,
          exchangeRate: Number(values.exchangeRate),
          inLeg: { amount: Number(values.inAmount), currencyId: values.inCurrencyId },
          outLeg: { amount: Number(values.outAmount), currencyId: values.outCurrencyId }
        });
      })}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DatePicker
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.exchangeDate")}
            name="exchangeDate"
            required
            rules={{ required: t("transactions.validation.exchangeDateRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <NumberField
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.exchangeRate")}
            name="exchangeRate"
            required
            rules={{ required: t("transactions.validation.exchangeRateRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextArea
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.description")}
            name="description"
            minRows={3}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <h3 style={{ margin: 0 }}>{t("transactions.exchangeLegs")}</h3>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <NumberField
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.outAmount")}
            name="outAmount"
            required
            rules={{ required: t("transactions.validation.outAmountRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DropDown
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.outCurrency")}
            name="outCurrencyId"
            options={currencyOptions}
            required
            rules={{ required: t("transactions.validation.outCurrencyRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <NumberField
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.inAmount")}
            name="inAmount"
            required
            rules={{ required: t("transactions.validation.inAmountRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DropDown
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.inCurrency")}
            name="inCurrencyId"
            options={currencyOptions}
            required
            rules={{ required: t("transactions.validation.inCurrencyRequired") }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Stack direction="row" justifyContent="flex-end">
            <ActionButton disabled={isSubmitting} type="submit">
              {isSubmitting ? t("action.working") : submitLabel}
            </ActionButton>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}

