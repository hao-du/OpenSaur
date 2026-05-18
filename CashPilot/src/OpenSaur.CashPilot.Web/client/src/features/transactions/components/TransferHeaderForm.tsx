import { Grid, Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number as NumberField } from "../../../components/atoms/Number";
import { TextArea } from "../../../components/atoms/TextArea";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import { useSettings } from "../../settings/provider/SettingProvider";

type Props = {
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  calculatedAmount: number;
  initialValues?: {
    counterpartyId: string;
    transferType: string;
    status: string;
    currencyId: string;
    amount?: string;
    transactionDate: string;
    dueDate?: string;
    description?: string;
  };
  isSubmitting?: boolean;
  submitLabel?: string;
  showSubmit?: boolean;
  onChange?: (values: {
    counterpartyId: string;
    transferType: number;
    status: number;
    currencyId: string;
    amount: number;
    transactionDate: string;
    dueDate?: string;
    description?: string;
  }) => void;
  onSubmit: (payload: {
    counterpartyId: string;
    transferType: number;
    status: number;
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
  status: string;
  currencyId: string;
  amount: string;
  transactionDate: string;
  dueDate: string;
  description: string;
};

export function TransferHeaderForm({ counterparties, currencies, calculatedAmount, initialValues, isSubmitting = false, submitLabel = "Create Transfer", showSubmit = true, onChange, onSubmit }: Props) {
  const { t } = useSettings();
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm<FormValues>({
    defaultValues: {
      amount: "",
      counterpartyId: counterparties[0]?.id ?? "",
      currencyId: currencies[0]?.id ?? "",
      description: "",
      dueDate: "",
      transactionDate: today,
      transferType: "1",
      status: "1"
    }
  });

  useEffect(() => {
    form.setValue("amount", calculatedAmount.toString(), { shouldValidate: false, shouldDirty: false });
  }, [calculatedAmount, form]);

  useEffect(() => {
    if (initialValues == null) {
      return;
    }
    form.reset({
      amount: initialValues.amount ?? calculatedAmount.toString(),
      counterpartyId: initialValues.counterpartyId,
      currencyId: initialValues.currencyId,
      description: initialValues.description ?? "",
      dueDate: initialValues.dueDate ?? "",
      transactionDate: initialValues.transactionDate,
      transferType: initialValues.transferType,
      status: initialValues.status
    });
  }, [calculatedAmount, form, initialValues]);

  const watched = useWatch({ control: form.control });
  useEffect(() => {
    if (onChange == null) {
      return;
    }
    onChange({
      amount: Number(watched.amount ?? "0"),
      counterpartyId: watched.counterpartyId ?? "",
      currencyId: watched.currencyId ?? "",
      description: watched.description?.trim().length ? watched.description.trim() : undefined,
      dueDate: watched.dueDate?.trim().length ? watched.dueDate : undefined,
      transactionDate: watched.transactionDate ?? today,
      transferType: Number(watched.transferType ?? "1"),
      status: Number(watched.status ?? "1")
    });
  }, [onChange, today, watched]);

  return (
    <Stack spacing={3}>
      <Grid container spacing={2} component="form" noValidate onSubmit={form.handleSubmit(async values => {
        await onSubmit({
          amount: Number(values.amount),
          counterpartyId: values.counterpartyId,
          currencyId: values.currencyId,
          description: values.description.trim().length === 0 ? undefined : values.description.trim(),
          dueDate: values.dueDate.trim().length === 0 ? undefined : values.dueDate,
          transactionDate: values.transactionDate,
          transferType: Number(values.transferType),
          status: Number(values.status)
        });
      })}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DropDown
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.counterparty")}
            name="counterpartyId"
            options={counterparties.map(x => ({ label: x.fullName, value: x.id }))}
            required
            rules={{ required: t("transactions.validation.counterpartyRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DropDown
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.type")}
            name="transferType"
            options={[
              { label: t("transactions.transferType.lend"), value: "1" },
              { label: t("transactions.transferType.borrow"), value: "2" },
              { label: t("transactions.transferType.give"), value: "3" },
              { label: t("transactions.transferType.receive"), value: "4" }
            ]}
            required
            rules={{ required: t("transactions.validation.typeRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DropDown
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.status")}
            name="status"
            options={[
              { label: t("transactions.statusType.active"), value: "1" },
              { label: t("transactions.statusType.completed"), value: "2" },
              { label: t("transactions.statusType.cancelled"), value: "3" }
            ]}
            required
            rules={{ required: t("transactions.validation.statusRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <NumberField
            control={form.control}
            disabled
            label={t("transactions.amount")}
            name="amount"
            required
            rules={{ required: t("transactions.validation.amountRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DropDown
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.currency")}
            name="currencyId"
            options={currencies.map(x => ({ label: x.shortName, value: x.id }))}
            required
            rules={{ required: t("transactions.validation.currencyRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DatePicker
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.transactionDate")}
            name="transactionDate"
            required
            rules={{ required: t("transactions.validation.transactionDateRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DatePicker
            control={form.control}
            disabled={isSubmitting}
            label={t("transactions.dueDate")}
            name="dueDate"
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
        {showSubmit ? (
          <Grid size={{ xs: 12 }}>
            <Stack direction="row" justifyContent="flex-end">
              <ActionButton disabled={isSubmitting} type="submit">
                {isSubmitting ? t("action.working") : submitLabel}
              </ActionButton>
            </Stack>
          </Grid>
        ) : null}
      </Grid>
    </Stack>
  );
}

