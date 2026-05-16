import { Grid, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { DateTimePicker } from "../../../components/atoms/DateTimePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number as NumberField } from "../../../components/atoms/Number";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { SaveBankAccountDetailRequestDto, SaveBankAccountFormRequestDto } from "../dtos/TransactionDto";
import { BankAccountTransactionForm, type DetailEditor } from "./BankAccountTransactionForm";

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
  isActive: boolean;
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
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm<HeaderValues>({
    defaultValues: {
      accountNumber: initialValue?.accountNumber ?? "",
      amount: initialValue?.amount?.toString() ?? "",
      bankId: initialValue?.bankId ?? banks[0]?.id ?? "",
      currencyId: initialValue?.currencyId ?? currencies[0]?.id ?? "",
      description: initialValue?.description ?? "",
      interestRate: initialValue?.interestRate?.toString() ?? "",
      isActive: initialValue?.isActive ?? true,
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

  useEffect(() => {
    form.reset({
      accountNumber: initialValue?.accountNumber ?? "",
      amount: initialValue?.amount?.toString() ?? "",
      bankId: initialValue?.bankId ?? banks[0]?.id ?? "",
      currencyId: initialValue?.currencyId ?? currencies[0]?.id ?? "",
      description: initialValue?.description ?? "",
      interestRate: initialValue?.interestRate?.toString() ?? "",
      isActive: initialValue?.isActive ?? true,
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
        isActive: values.isActive
      });
    }

    const matured = finalDetails.find(x => x.transactionType === 3);
    if (values.status === "2" || values.status === "3") {
      if (matured) {
        matured.amount = Number(values.amount);
        matured.transactionDate = values.maturityDate;
        matured.description = values.description.trim().length === 0 ? undefined : values.description.trim();
        matured.currencyId = values.currencyId;
        matured.direction = 1;
        matured.isActive = true;
      } else {
        finalDetails.push({
          currencyId: values.currencyId,
          amount: Number(values.amount),
          direction: 1,
          transactionDate: values.maturityDate,
          transactionType: 3,
          description: values.description.trim().length === 0 ? undefined : values.description.trim(),
          isActive: values.isActive
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
      interestRate: Number(values.interestRate),
      startDate: values.startDate,
      maturityDate: values.maturityDate,
      status: Number(values.status),
      accountNumber: values.accountNumber.trim().length === 0 ? undefined : values.accountNumber.trim(),
      description: values.description.trim().length === 0 ? undefined : values.description.trim(),
      isActive: values.isActive,
      details: finalDetails
    });
  };

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Text
            control={form.control}
            label="Account Number"
            name="accountNumber"
            required
            rules={{
              required: "Account Number is required.",
              validate: value => typeof value === "string" && value.trim().length > 0 ? true : "Account Number is required."
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DropDown
            control={form.control}
            label="Bank"
            name="bankId"
            options={banks.map(x => ({ label: x.shortName, value: x.id }))}
            required
            rules={{ required: "Bank is required." }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <NumberField
            control={form.control}
            label="Interest %"
            name="interestRate"
            required
            rules={{
              required: "Interest % is required.",
              validate: value => {
                if (!Number.isFinite(Number(value))) return "Interest % is invalid.";
                return Number(value) <= 100 ? true : "Interest rate must be 100 or less.";
              }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <NumberField
            control={form.control}
            label="Amount"
            name="amount"
            required
            rules={{
              required: "Amount is required.",
              validate: value => Number.isFinite(Number(value)) ? true : "Amount is invalid."
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DropDown
            control={form.control}
            label="Currency"
            name="currencyId"
            options={currencies.map(x => ({ label: x.shortName, value: x.id }))}
            required
            rules={{ required: "Currency is required." }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DateTimePicker
            control={form.control}
            label="Start Date"
            name="startDate"
            required
            rules={{ required: "Start Date is required." }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DateTimePicker
            control={form.control}
            label="Maturity Date"
            name="maturityDate"
            required
            rules={{
              required: "Maturity Date is required.",
              validate: value => value >= form.getValues("startDate") ? true : "Maturity Date must be on or after Start Date."
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DropDown
            control={form.control}
            label="Status"
            name="status"
            options={[
              { label: "Active", value: "1" },
              { label: "Matured", value: "2" },
              { label: "Closed Early", value: "3" }
            ]}
            required
            rules={{ required: "Status is required." }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", alignItems: "center" }}>
          <CheckBox control={form.control} label="Is Active" name="isActive" />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextArea control={form.control} label="Description" name="description" minRows={3} />
        </Grid>
      </Grid>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
        <h3 style={{ margin: 0 }}>Transaction Details</h3>
        <ActionButton onClick={addNewDetail} color="secondary" size="small">
          Add Transaction
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
          {isSubmitting ? "Working..." : submitLabel}
        </ActionButton>
      </Stack>
    </Stack>
  );
}

