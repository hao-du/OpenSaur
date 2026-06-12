import { Alert, Grid, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number as NumberInput } from "../../../../components/atoms/Number";
import { Text } from "../../../../components/atoms/Text";
import { TextArea } from "../../../../components/atoms/TextArea";
import type { TranslationKey } from "../../../settings/provider/translations";
import { OfflineTagAutocompleteMultiSelect } from "../OfflineTagAutocompleteMultiSelect";
import { TransactionItemsEditor } from "../../../transactions/components/TransactionItemsEditor";
import { TransactionFormTabs } from "../../../transactions/components/TransactionFormTabs";
import type { SaveBankAccountFormRequestDto } from "../../../transactions/dtos/TransactionDto";
import { bankAccountStatuses, bankAccountTransactionTypes, transactionDirectionValues } from "../../../../infrastructure/constants/transactionEnums";
import type { OfflineTransactionRecord } from "../../storages/offlineTransactionsStore";
import type { BankAccountTemplateDataShape, BankAccountFormValues, OptionItem } from "./types";
import {
  initialDateValue,
  initialTagsValue,
  initialValue,
  isRequired,
  resolve,
  resolveDate,
  resolveOptionalDescription,
  resolveTags,
  shown,
} from "./utils";
import { REQUIRED_FIELD_MESSAGE, UNABLE_TO_SAVE_TRANSACTION_MESSAGE } from "./constants";

type Props = {
  formId: string;
  t: (key: TranslationKey) => string;
  todayIsoDate: string;
  currencyOptions: OptionItem[];
  bankOptions: OptionItem[];
  templateData: BankAccountTemplateDataShape;
  onClose: () => void;
  onSave: (record: Omit<OfflineTransactionRecord, "updatedAt">) => Promise<void> | void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
};

export function OfflineBankAccountPopulateForm({
  formId,
  t,
  todayIsoDate,
  currencyOptions,
  bankOptions,
  templateData,
  onClose,
  onSave,
  onSubmittingChange,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState<"form" | "items">("form");

  const defaults = useMemo<BankAccountFormValues>(
    () => ({
      bankId: initialValue(templateData.bankId, todayIsoDate),
      accountNumber: initialValue(templateData.accountNumber, todayIsoDate),
      amount: initialValue(templateData.amount, todayIsoDate),
      currencyId: initialValue(templateData.currencyId, todayIsoDate),
      interestRate: initialValue(templateData.interestRate, todayIsoDate),
      startDate: initialDateValue(templateData.startDate, todayIsoDate),
      maturityDate: initialDateValue(templateData.maturityDate, todayIsoDate),
      description: initialValue(templateData.description, todayIsoDate),
      tags: initialTagsValue(templateData.tags),
      transactionItems: [],
    }),
    [templateData, todayIsoDate],
  );

  const form = useForm<BankAccountFormValues>({ defaultValues: defaults });
  const currencyId = useWatch({ control: form.control, name: "currencyId" });
  const selectedCurrencyCode = currencyOptions.find((x) => x.value === currencyId)?.label;

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const submit = async (values: BankAccountFormValues) => {
    setIsSubmitting(true);
    onSubmittingChange?.(true);
    setError(null);

    try {
      const resolvedBankId = resolve(templateData.bankId, values.bankId, todayIsoDate);
      const resolvedCurrencyId = resolve(templateData.currencyId, values.currencyId, todayIsoDate);
      const resolvedAmount = resolve(templateData.amount, values.amount, todayIsoDate);
      const resolvedInterestRate = resolve(templateData.interestRate, values.interestRate, todayIsoDate);
      const resolvedStartDate = resolveDate(templateData.startDate, values.startDate, todayIsoDate);
      const resolvedMaturityDate = resolveDate(templateData.maturityDate, values.maturityDate, todayIsoDate);
      const resolvedDescription = resolveOptionalDescription(templateData.description, values.description, todayIsoDate);
      const resolvedTags = resolveTags(templateData.tags, values.tags);
      const transactionItems = values.transactionItems
        .filter((x) => x.name.trim().length > 0)
        .map((x) => ({
          id: x.id,
          name: x.name.trim(),
          amount: Number(x.amount || "0"),
        }));

      const payload: SaveBankAccountFormRequestDto = {
        accountNumber: initialValue(templateData.accountNumber, todayIsoDate) || values.accountNumber.trim() || undefined,
        amount: Number(resolvedAmount || "0"),
        bankId: resolvedBankId,
        currencyId: resolvedCurrencyId,
        description: resolvedDescription,
        details: [],
        id: crypto.randomUUID(),
        interestRate: Number(resolvedInterestRate || "0"),
        isActive: true,
        maturityDate: resolvedMaturityDate.trim().length > 0 ? resolvedMaturityDate : undefined,
        startDate: resolvedStartDate,
        status: bankAccountStatuses.active,
        tags: resolvedTags,
        transactionItems,
      };

      const record: Omit<OfflineTransactionRecord, "updatedAt"> = {
        amount: payload.amount,
        bankAccountStatus: payload.status,
        bankAccountTransactionType: bankAccountTransactionTypes.initialDeposit,
        bankName: bankOptions.find((item) => item.value === payload.bankId)?.label ?? null,
        counterpartyName: null,
        direction: transactionDirectionValues.inflow,
        currencyCode: currencyOptions.find((item) => item.value === payload.currencyId)?.label ?? payload.currencyId,
        description: payload.description ?? "",
        exchangeId: null,
        id: payload.id ?? crypto.randomUUID(),
        isActive: payload.isActive,
        payloadJson: JSON.stringify(payload),
        tags: payload.tags ?? [],
        transactionDate: payload.startDate,
        transferId: null,
        transferStatus: null,
        transferType: null,
        type: "BankAccount",
      };

      await onSave(record);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : UNABLE_TO_SAVE_TRANSACTION_MESSAGE);
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  };

  return (
    <Stack spacing={2} component="form" id={formId} onSubmit={form.handleSubmit(submit)}>
      {error ? <Alert severity="error">{error}</Alert> : null}
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
          <Grid container spacing={2}>
            {shown(templateData.accountNumber) ? (
              <Grid size={{ xs: 12 }}>
                <Text control={form.control} name="accountNumber" label={t("transactions.accountNumber")} />
              </Grid>
            ) : null}
            {shown(templateData.bankId) ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <DropDown
                  control={form.control}
                  name="bankId"
                  label={t("transactions.bank")}
                  options={bankOptions}
                  required={isRequired(templateData.bankId)}
                  rules={isRequired(templateData.bankId) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
                />
              </Grid>
            ) : null}
            {shown(templateData.interestRate) ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <NumberInput
                  control={form.control}
                  name="interestRate"
                  label={t("transactions.interestRate")}
                  rules={{
                    validate: (value) => {
                      if (typeof value === "string" && value.trim().length === 0) {
                        return true;
                      }

                      if (!Number.isFinite(Number(value))) {
                        return t("transactions.validation.interestRateInvalid");
                      }

                      const numericValue = Number(value);
                      return numericValue >= 0 && numericValue <= 100
                        ? true
                        : t("transactions.validation.interestRateRange");
                    },
                  }}
                />
              </Grid>
            ) : null}
            {shown(templateData.amount) ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <NumberInput
                  control={form.control}
                  name="amount"
                  label={t("transactions.amount")}
                  required={isRequired(templateData.amount)}
                  rules={isRequired(templateData.amount) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
                />
              </Grid>
            ) : null}
            {shown(templateData.currencyId) ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <DropDown
                  control={form.control}
                  name="currencyId"
                  label={t("transactions.currency")}
                  options={currencyOptions}
                  required={isRequired(templateData.currencyId)}
                  rules={isRequired(templateData.currencyId) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
                />
              </Grid>
            ) : null}
            {shown(templateData.startDate) ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  control={form.control}
                  name="startDate"
                  label={t("transactions.startDate")}
                  required={isRequired(templateData.startDate)}
                  rules={isRequired(templateData.startDate) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
                />
              </Grid>
            ) : null}
            {shown(templateData.maturityDate) ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker control={form.control} name="maturityDate" label={t("transactions.maturityDate")} />
              </Grid>
            ) : null}
            {shown(templateData.description) ? (
              <Grid size={{ xs: 12 }}>
                <TextArea control={form.control} name="description" label={t("transactions.description")} minRows={3} />
              </Grid>
            ) : null}
            {shown(templateData.tags) ? (
              <Grid size={{ xs: 12 }}>
                <OfflineTagAutocompleteMultiSelect control={form.control} name="tags" label={t("tags.title")} />
              </Grid>
            ) : null}
          </Grid>
        }
      />
    </Stack>
  );
}
