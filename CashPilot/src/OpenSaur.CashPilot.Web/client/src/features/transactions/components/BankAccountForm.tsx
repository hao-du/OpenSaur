import { Grid, Stack } from "@mui/material";
import { WandSparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number as NumberField } from "../../../components/atoms/Number";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import { TagAutocompleteMultiSelect } from "../../tags/components/TagAutocompleteMultiSelect";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type {
  SaveBankAccountDetailRequestDto,
  SaveBankAccountFormRequestDto
} from "../dtos/TransactionDto";
import { BankAccountTransactionForm, type DetailEditor } from "./BankAccountTransactionForm";
import { TransactionItemsEditor } from "./TransactionItemsEditor";
import { TransactionFormTabs } from "./TransactionFormTabs";
import { bankAccountStatuses, bankAccountTransactionTypes, transactionDirectionValues, transactionDirections, transactionFormTabs } from "../../../infrastructure/constants/transactionEnums";

type Props = {
  banks: BankDto[];
  currencies: CurrencyDto[];
  initialValue?: SaveBankAccountFormRequestDto | null;
  onSubmit: (payload: SaveBankAccountFormRequestDto) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  isAutoTagging?: boolean;
  onAutoTag?: (description: string, existingTags: string[], transactionType: "BankAccount") => Promise<string[]>;
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
  tags: string[];
  transactionItems: Array<{ id?: string; name: string; amount: string }>;
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

function getInitialHeaderValues(
  initialValue: SaveBankAccountFormRequestDto | null | undefined,
  banks: BankDto[],
  currencies: CurrencyDto[],
  today: string,
): HeaderValues {
  return {
    accountNumber: initialValue?.accountNumber ?? "",
    amount: initialValue?.amount?.toString() ?? "",
    bankId: initialValue?.bankId ?? banks[0]?.id ?? "",
    currencyId: initialValue?.currencyId ?? currencies[0]?.id ?? "",
    description: initialValue?.description ?? "",
    interestRate: initialValue?.interestRate?.toString() ?? "",
    maturityDate: initialValue?.maturityDate ?? today,
    startDate: initialValue?.startDate ?? today,
    status: String(initialValue?.status ?? bankAccountStatuses.active),
    tags: initialValue?.tags ?? [],
    transactionItems: (initialValue?.transactionItems ?? []).map((x) => ({
      id: x.id,
      name: x.name,
      amount: x.amount.toString(),
    })),
  };
}

function getInitialDetails(
  initialValue: SaveBankAccountFormRequestDto | null | undefined,
): DetailEditor[] {
  return (initialValue?.details ?? []).map((x) => ({
    clientKey: crypto.randomUUID(),
    id: x.id,
    currencyId: x.currencyId,
    amount: x.amount.toString(),
    direction: x.direction.toString(),
    transactionType: x.transactionType.toString(),
    transactionDate: x.transactionDate,
    description: x.description ?? "",
    isActive: x.isActive,
    isNew: false,
  }));
}

export function BankAccountForm({
  banks,
  currencies,
  initialValue,
  onSubmit,
  submitLabel = "Create",
  isSubmitting = false,
  isAutoTagging = false,
  onAutoTag,
}: Props) {
  const { t, todayIsoDate } = useSettings();
  const today = todayIsoDate;

  const [tab, setTab] = useState<(typeof transactionFormTabs)[keyof typeof transactionFormTabs]>(transactionFormTabs.form);

  const form = useForm<HeaderValues>({
    defaultValues: getInitialHeaderValues(initialValue, banks, currencies, today)
  });

  const [details, setDetails] = useState<DetailEditor[]>(() => getInitialDetails(initialValue));

  const startDate = useWatch({ control: form.control, name: "startDate" });
  const maturityDate = useWatch({ control: form.control, name: "maturityDate" });
  const status = useWatch({ control: form.control, name: "status" });
  const currencyId = useWatch({ control: form.control, name: "currencyId" });
  const selectedCurrencyCode = currencies.find(x => x.id === currencyId)?.shortName;

  useEffect(() => {
    void form.trigger(["startDate", "maturityDate"]);
  }, [form, maturityDate, startDate]);

  const handleAutoTag = async () => {
    if (onAutoTag == null) {
      return;
    }

    const values = form.getValues();
    const tags = await onAutoTag(values.description, values.tags, "BankAccount");
    form.setValue("tags", tags, { shouldDirty: true, shouldTouch: true });
  };

  const submitHandler = async (values: HeaderValues) => {
    const headerIsActive = initialValue?.isActive ?? true;
    const finalDetails = details.map(toDetailRequest);

    const initialDeposit = finalDetails.find((x) => x.transactionType === bankAccountTransactionTypes.initialDeposit);
    if (initialDeposit) {
      initialDeposit.amount = Number(values.amount);
      initialDeposit.transactionDate = values.startDate;
      initialDeposit.description = values.description.trim().length === 0 ? undefined : values.description.trim();
      initialDeposit.currencyId = values.currencyId;
      initialDeposit.direction = Number(transactionDirections.outflow);
    } else {
      finalDetails.push({
        currencyId: values.currencyId,
        amount: Number(values.amount),
        direction: Number(transactionDirections.inflow),
        transactionDate: values.startDate,
        transactionType: bankAccountTransactionTypes.initialDeposit,
        description: values.description.trim().length === 0 ? undefined : values.description.trim(),
        isActive: headerIsActive
      });
    }

    const matured = finalDetails.find((x) => x.transactionType === bankAccountTransactionTypes.principalReturn);
    if (values.status === String(bankAccountStatuses.matured) || values.status === String(bankAccountStatuses.closedEarly)) {
      if (matured) {
        matured.amount = Number(values.amount);
        matured.transactionDate = values.maturityDate || values.startDate;
        matured.description = values.description.trim().length === 0 ? undefined : values.description.trim();
        matured.currencyId = values.currencyId;
        matured.direction = transactionDirectionValues.inflow;
        matured.isActive = true;
      } else {
        finalDetails.push({
          currencyId: values.currencyId,
          amount: Number(values.amount),
          direction: transactionDirectionValues.inflow,
          transactionDate: values.maturityDate || values.startDate,
          transactionType: bankAccountTransactionTypes.principalReturn,
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
      tags: values.tags,
      isActive: headerIsActive,
      details: finalDetails,
      transactionItems: values.transactionItems
        .filter(x => x.name.trim().length > 0)
        .map(x => ({
          id: x.id,
          name: x.name.trim(),
          amount: Number(x.amount || "0")
        }))
    });
  };

  return (
    <Stack spacing={2}>
      <TransactionFormTabs
        value={tab}
        onChange={setTab}
        itemsContent={
          <TransactionItemsEditor
            control={form.control}
            name="transactionItems"
            disabled={isSubmitting}
            currencyCode={selectedCurrencyCode}
          />
        }
        formContent={
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Text control={form.control} label={t("transactions.accountNumber")} name="accountNumber" />
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
                      if (typeof value === "string" && value.trim().length === 0) {
                        return true;
                      }
                      if (!Number.isFinite(Number(value))) {
                        return t("transactions.validation.interestRateInvalid");
                      }
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
                  required={status === String(bankAccountStatuses.matured)}
                  rules={{
                    validate: value => {
                      const dateValue = typeof value === "string" ? value : "";
                      if (status === String(bankAccountStatuses.matured) && dateValue.trim().length === 0) {
                        return t("transactions.validation.maturityDateRequired");
                      }
                      if (dateValue.trim().length === 0) {
                        return true;
                      }
                      return dateValue >= form.getValues("startDate")
                        ? true
                        : t("transactions.validation.maturityDateAfterStartDate");
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
                    { label: t("transactions.statusType.active"), value: String(bankAccountStatuses.active) },
                    { label: t("transactions.statusType.matured"), value: String(bankAccountStatuses.matured) },
                    { label: t("transactions.statusType.closedEarly"), value: String(bankAccountStatuses.closedEarly) }
                  ]}
                  required
                  rules={{ required: t("transactions.validation.statusRequired") }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextArea
                  control={form.control}
                  label={t("transactions.description")}
                  name="description"
                  minRows={3}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TagAutocompleteMultiSelect
                  control={form.control}
                  label={t("tags.title")}
                  name="tags"
                />
              </Grid>
            </Grid>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <h3 style={{ margin: 0 }}>{t("transactions.transactionDetails")}</h3>
              <ActionButton
                onClick={() => {
                  setDetails(prev => [
                    ...prev,
                    {
                      clientKey: crypto.randomUUID(),
                      currencyId: currencies[0]?.id ?? "",
                      amount: "",
                      direction: String(transactionDirectionValues.inflow),
                      transactionType: String(bankAccountTransactionTypes.interestPayment),
                      transactionDate: today,
                      description: "",
                      isActive: true,
                      isNew: true
                    }
                  ]);
                }}
                color="secondary"
                size="small"
              >
                {t("transactions.addTransaction")}
              </ActionButton>
            </Stack>

            <Stack spacing={2}>
              {details
                .filter(d => d.transactionType === String(bankAccountTransactionTypes.interestPayment))
                .map(detail => (
                  <BankAccountTransactionForm
                    key={detail.clientKey}
                    detail={detail}
                    onAccept={updated =>
                      setDetails(prev => prev.map(x => x.clientKey === detail.clientKey ? updated : x))
                    }
                    onDelete={() =>
                      setDetails(prev => prev.filter(x => x.clientKey !== detail.clientKey))
                    }
                    onCancelNew={() =>
                      setDetails(prev => prev.filter(x => x.clientKey !== detail.clientKey))
                    }
                  />
                ))}
            </Stack>

            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <ActionButton
                disabled={isSubmitting || isAutoTagging || onAutoTag == null}
                onClick={() => {
                  void handleAutoTag();
                }}
                startIcon={<WandSparkles size={16} />}
                variant="outlined"
              >
                {isAutoTagging ? t("action.working") : t("transactions.autoTag")}
              </ActionButton>
              <ActionButton
                onClick={() => {
                  void form.handleSubmit(submitHandler)();
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? t("action.working") : submitLabel}
              </ActionButton>
            </Stack>
          </Stack>
        }
      />
    </Stack>
  );
}
