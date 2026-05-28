import { Grid, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number as NumberField } from "../../../components/atoms/Number";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { SaveBankAccountDetailRequestDto, SaveBankAccountFormRequestDto } from "../dtos/TransactionDto";
import { BankAccountTransactionForm, type DetailEditor } from "./BankAccountTransactionForm";
import { useSettings } from "../../settings/provider/SettingProvider";

type Props = {
  banks: BankDto[];
  currencies: CurrencyDto[];
  initialValue?: SaveBankAccountFormRequestDto | null;
  onSubmit: (payload: SaveBankAccountFormRequestDto) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
};

type HeaderValues = {
  bankId: string;
  currencyId: string;
  amount: string;
  interestRate: string;
  startDate: string;
  maturityDate: string;
  status: string;
  accountNumber: string;
  description: string;
};

function toDetailRequest(detail: DetailEditor): SaveBankAccountDetailRequestDto {
  return {
    id: detail.id,
    currencyId: detail.currencyId,
    amount: Number(detail.amount),
    direction: Number(detail.direction),
    transactionDate: detail.transactionDate,
    transactionType: Number(detail.transactionType),
    description: detail.description.trim().length === 0 ? undefined : detail.description.trim(),
    isActive: detail.isActive
  };
}

export function BankAccountForm({ banks, currencies, initialValue, onSubmit, submitLabel = "Create", isSubmitting = false }: Props) {
  const { t, todayIsoDate } = useSettings();
  const today = todayIsoDate;
  const form = useForm<HeaderValues>({
    defaultValues: {
      accountNumber: initialValue?.accountNumber ?? "",
      amount: initialValue?.amount?.toString() ?? "",
      bankId: initialValue?.bankId ?? banks[0]?.id ?? "",
      currencyId: initialValue?.currencyId ?? currencies[0]?.id ?? "",
      description: initialValue?.description ?? "",
      interestRate: initialValue?.interestRate?.toString() ?? "",
      maturityDate: initialValue?.maturityDate ?? today,
      startDate: initialValue?.startDate ?? today,
      status: (initialValue?.status ?? 1).toString()
    }
  });

  const [details, setDetails] = useState<DetailEditor[]>(
    (initialValue?.details ?? []).map(x => ({
      clientKey: crypto.randomUUID(),
      id: x.id,
      currencyId: x.currencyId,
      amount: x.amount.toString(),
      direction: x.direction.toString(),
      transactionType: x.transactionType.toString(),
      transactionDate: x.transactionDate,
      description: x.description ?? "",
      isActive: x.isActive,
      isNew: false
    }))
  );
  const startDate = useWatch({ control: form.control, name: "startDate" });
  const maturityDate = useWatch({ control: form.control, name: "maturityDate" });
  const status = useWatch({ control: form.control, name: "status" });

  useEffect(() => {
    form.reset({
      accountNumber: initialValue?.accountNumber ?? "",
      amount: initialValue?.amount?.toString() ?? "",
      bankId: initialValue?.bankId ?? banks[0]?.id ?? "",
      currencyId: initialValue?.currencyId ?? currencies[0]?.id ?? "",
      description: initialValue?.description ?? "",
      interestRate: initialValue?.interestRate?.toString() ?? "",
      maturityDate: initialValue?.maturityDate ?? today,
      startDate: initialValue?.startDate ?? today,
      status: (initialValue?.status ?? 1).toString()
    });

    setDetails(
      (initialValue?.details ?? []).map(x => ({
        clientKey: crypto.randomUUID(),
        id: x.id,
        currencyId: x.currencyId,
        amount: x.amount.toString(),
        direction: x.direction.toString(),
        transactionType: x.transactionType.toString(),
        transactionDate: x.transactionDate,
        description: x.description ?? "",
        isActive: x.isActive,
        isNew: false
      }))
    );
  }, [banks, currencies, form, initialValue, today]);

  useEffect(() => {
    void form.trigger(["startDate", "maturityDate"]);
  }, [form, maturityDate, startDate]);

  const addNewDetail = () => {
    setDetails(prev => [...prev, {
      clientKey: crypto.randomUUID(),
      currencyId: currencies[0]?.id ?? "",
      amount: "",
      direction: "1",
      transactionType: "2",
      transactionDate: today,
      description: "",
      isActive: true,
      isNew: true
    }]);
  };

  const updateDetail = (clientKey: string, updated: DetailEditor) => {
    setDetails(prev => prev.map(x => x.clientKey === clientKey ? updated : x));
  };

  const removeDetail = (clientKey: string) => {
    setDetails(prev => prev.filter(x => x.clientKey !== clientKey));
  };

  const submitHandler = async (values: HeaderValues) => {
    const headerIsActive = initialValue?.isActive ?? true;
    const finalDetails = details.map(toDetailRequest);

    const initialDeposit = finalDetails.find(x => x.transactionType === 1);
    if (initialDeposit) {
      initialDeposit.amount = Number(values.amount);
      initialDeposit.transactionDate = values.startDate;
      initialDeposit.description = values.description.trim().length === 0 ? undefined : values.description.trim();
      initialDeposit.currencyId = values.currencyId;
      initialDeposit.direction = 2;
    } else {
        finalDetails.push({
          currencyId: values.currencyId,
          amount: Number(values.amount),
          direction: 2,
          transactionDate: values.startDate,
          transactionType: 1,
          description: values.description.trim().length === 0 ? undefined : values.description.trim(),
          isActive: headerIsActive
        });
    }

    const matured = finalDetails.find(x => x.transactionType === 3);
    if (values.status === "2" || values.status === "3") {
      if (matured) {
        matured.amount = Number(values.amount);
        matured.transactionDate = values.maturityDate || values.startDate;
        matured.description = values.description.trim().length === 0 ? undefined : values.description.trim();
        matured.currencyId = values.currencyId;
        matured.direction = 1;
        matured.isActive = true;
      } else {
        finalDetails.push({
          currencyId: values.currencyId,
          amount: Number(values.amount),
          direction: 1,
          transactionDate: values.maturityDate || values.startDate,
          transactionType: 3,
          description: values.description.trim().length === 0 ? undefined : values.description.trim(),
          isActive: headerIsActive
        });
      }
    } else if (matured) {
      matured.isActive = false;
    }

    await onSubmit({
      id: initialValue?.id,
      bankId: values.bankId,
      currencyId: values.currencyId,
      amount: Number(values.amount),
      interestRate: values.interestRate.trim().length === 0 ? undefined : Number(values.interestRate),
      startDate: values.startDate,
      maturityDate: values.maturityDate.trim().length === 0 ? undefined : values.maturityDate,
      status: Number(values.status),
      accountNumber: values.accountNumber.trim().length === 0 ? undefined : values.accountNumber.trim(),
      description: values.description.trim().length === 0 ? undefined : values.description.trim(),
      isActive: headerIsActive,
      details: finalDetails
    });
  };

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Text
            control={form.control}
            label={t("transactions.accountNumber")}
            name="accountNumber"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DropDown
            control={form.control}
            label={t("transactions.bank")}
            name="bankId"
            options={banks.map(x => ({ label: x.shortName, value: x.id }))}
            required
            rules={{ required: t("transactions.validation.bankRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <NumberField
            control={form.control}
            label={t("transactions.interestRate")}
            name="interestRate"
            rules={{
              validate: value => {
                if (typeof value === "string" && value.trim().length === 0) return true;
                if (!Number.isFinite(Number(value))) return t("transactions.validation.interestRateInvalid");
                return Number(value) <= 100 ? true : t("transactions.validation.interestRateMax");
              }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <NumberField
            control={form.control}
            label={t("transactions.amount")}
            name="amount"
            required
            rules={{
              required: t("transactions.validation.amountRequired"),
              validate: value => Number.isFinite(Number(value)) ? true : t("transactions.validation.amountInvalid")
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DropDown
            control={form.control}
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
            label={t("transactions.startDate")}
            name="startDate"
            required
            rules={{ required: t("transactions.validation.startDateRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DatePicker
            control={form.control}
            label={t("transactions.maturityDate")}
            name="maturityDate"
            required={status === "2"}
            rules={{
              validate: value => {
                if (status === "2" && (!value || value.trim().length === 0)) {
                  return t("transactions.validation.maturityDateRequired");
                }
                if (!value || value.trim().length === 0) {
                  return true;
                }
                return value >= form.getValues("startDate") ? true : t("transactions.validation.maturityDateAfterStartDate");
              }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DropDown
            control={form.control}
            label={t("transactions.status")}
            name="status"
            options={[
              { label: t("transactions.statusType.active"), value: "1" },
              { label: t("transactions.statusType.matured"), value: "2" },
              { label: t("transactions.statusType.closedEarly"), value: "3" }
            ]}
            required
            rules={{ required: t("transactions.validation.statusRequired") }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextArea control={form.control} label={t("transactions.description")} name="description" minRows={3} />
        </Grid>
      </Grid>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
        <h3 style={{ margin: 0 }}>{t("transactions.transactionDetails")}</h3>
        <ActionButton onClick={addNewDetail} color="secondary" size="small">
          {t("transactions.addTransaction")}
        </ActionButton>
      </Stack>

      <Stack spacing={2}>
        {details.filter(d => d.transactionType === "2").map(detail => (
          <BankAccountTransactionForm
            key={detail.clientKey}
            detail={detail}
            onAccept={updated => updateDetail(detail.clientKey, updated)}
            onDelete={() => removeDetail(detail.clientKey)}
            onCancelNew={() => removeDetail(detail.clientKey)}
          />
        ))}
      </Stack>

      <Stack direction="row" justifyContent="flex-end">
        <ActionButton
          onClick={() => { void form.handleSubmit(submitHandler)(); }}
          disabled={isSubmitting}
        >
          {isSubmitting ? t("action.working") : submitLabel}
        </ActionButton>
      </Stack>
    </Stack>
  );
}

