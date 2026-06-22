import { Alert, Grid, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number as NumberInput } from "../../../../components/atoms/Number";
import { Text } from "../../../../components/atoms/Text";
import { TextArea } from "../../../../components/atoms/TextArea";
import type { TranslationKey } from "../../../settings/provider/translations";
import { TagAutocompleteMultiSelect } from "../../../tags/components/TagAutocompleteMultiSelect";
import { useCreateBankAccountMutation } from "../../../transactions/hooks/useCreateBankAccountMutation";
import { TransactionItemsEditor } from "../../../transactions/components/TransactionItemsEditor";
import { TransactionFormTabs } from "../../../transactions/components/TransactionFormTabs";
import type {
  BankAccountFormValues,
  BankAccountTemplateDataShape,
  OptionItem,
} from "./types";
import {
  REQUIRED_FIELD_MESSAGE,
  UNABLE_TO_SAVE_TRANSACTION_MESSAGE,
} from "./constants";
import {
  initialDateValue,
  initialValue,
  initialTagsValue,
  isRequired,
  resolve,
  resolveDate,
  resolveOptionalDescription,
  resolveTags,
  shown,
} from "./utils";
type Props = {
  formId: string;
  t: (key: TranslationKey) => string;
  todayIsoDate: string;
  currencyOptions: OptionItem[];
  bankOptions: OptionItem[];
  templateData: BankAccountTemplateDataShape;
  onSaved?: () => Promise<void> | void;
  onClose: () => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
};
export function BankAccountPopulateForm({
  formId,
  t,
  todayIsoDate,
  currencyOptions,
  bankOptions,
  templateData,
  onSaved,
  onClose,
  onSubmittingChange,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState<"form" | "items">("form");
  const createBankAccountMutation = useCreateBankAccountMutation();
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
  const selectedCurrencyCode = currencyOptions.find(x => x.value === currencyId)?.label;
  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const submit = async (v: BankAccountFormValues) => {
    setIsSubmitting(true);
    onSubmittingChange?.(true);
    setError(null);
    try {
      const maturityDate = resolveDate(
        templateData.maturityDate,
        v.maturityDate,
        todayIsoDate,
      );
      await createBankAccountMutation.mutateAsync({
        bankId: resolve(templateData.bankId, v.bankId, todayIsoDate),
        accountNumber: resolve(
          templateData.accountNumber,
          v.accountNumber,
          todayIsoDate,
        ),
        status: 1,
        amount: globalThis.Number(
          resolve(templateData.amount, v.amount, todayIsoDate),
        ),
        currencyId: resolve(
          templateData.currencyId,
          v.currencyId,
          todayIsoDate,
        ),
        interestRate: globalThis.Number(
          resolve(templateData.interestRate, v.interestRate, todayIsoDate),
        ),
        startDate: resolveDate(
          templateData.startDate,
          v.startDate,
          todayIsoDate,
        ),
        maturityDate:
          maturityDate.trim().length > 0 ? maturityDate : undefined,
        description: resolveOptionalDescription(
          templateData.description,
          v.description,
          todayIsoDate,
        ),
        tags: resolveTags(templateData.tags, v.tags),
        details: [],
        transactionItems: v.transactionItems.filter(x => x.name.trim().length > 0).map(x => ({ name: x.name.trim(), amount: Number(x.amount || "0") })),
      });
      await onSaved?.();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : UNABLE_TO_SAVE_TRANSACTION_MESSAGE,
      );
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
        itemsContent={<TransactionItemsEditor control={form.control} name="transactionItems" disabled={isSubmitting} currencyCode={selectedCurrencyCode} />}
        formContent={<Grid container spacing={2}>
        {shown(templateData.accountNumber) ? (
          <Grid size={{ xs: 12 }}>
            <Text
              control={form.control}
              name="accountNumber"
              label={t("transactions.accountNumber")}
            />
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
              rules={
                isRequired(templateData.bankId)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
            />
          </Grid>
        ) : null}
        {shown(templateData.interestRate) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <NumberInput
              control={form.control}
              name="interestRate"
              label={t("transactions.interestRate")}
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
              rules={
                isRequired(templateData.amount)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
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
              rules={
                isRequired(templateData.currencyId)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
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
              rules={
                isRequired(templateData.startDate)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
            />
          </Grid>
        ) : null}
        {shown(templateData.maturityDate) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              control={form.control}
              name="maturityDate"
              label={t("transactions.maturityDate")}
            />
          </Grid>
        ) : null}
        {shown(templateData.description) ? (
          <Grid size={{ xs: 12 }}>
            <TextArea
              control={form.control}
              name="description"
              label={t("transactions.description")}
              minRows={3}
            />
          </Grid>
        ) : null}
        {shown(templateData.tags) ? (
          <Grid size={{ xs: 12 }}>
            <TagAutocompleteMultiSelect
              control={form.control}
              name="tags"
              label={t("tags.title")}
            />
          </Grid>
        ) : null}
      </Grid>}
      />
    </Stack>
  );
}
