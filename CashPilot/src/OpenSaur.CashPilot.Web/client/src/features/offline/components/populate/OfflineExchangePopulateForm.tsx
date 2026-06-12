import { Alert, Grid, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number as NumberInput } from "../../../../components/atoms/Number";
import { TextArea } from "../../../../components/atoms/TextArea";
import type { TranslationKey } from "../../../settings/provider/translations";
import { OfflineTagAutocompleteMultiSelect } from "../OfflineTagAutocompleteMultiSelect";
import { TransactionItemsEditor } from "../../../transactions/components/TransactionItemsEditor";
import { TransactionFormTabs } from "../../../transactions/components/TransactionFormTabs";
import type { OfflineTransactionRecord } from "../../storages/offlineTransactionsStore";
import type { ExchangeFormValues, ExchangeTemplateDataShape, OptionItem } from "./types";
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
import { REQUIRED_FIELD_MESSAGE, UNABLE_TO_SAVE_TRANSACTION_MESSAGE } from "./constants";

type Props = {
  formId: string;
  t: (key: TranslationKey) => string;
  todayIsoDate: string;
  currencyOptions: OptionItem[];
  templateData: ExchangeTemplateDataShape;
  onClose: () => void;
  onSave: (record: Omit<OfflineTransactionRecord, "updatedAt">) => Promise<void> | void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
};

export function OfflineExchangePopulateForm({
  formId,
  t,
  todayIsoDate,
  currencyOptions,
  templateData,
  onClose,
  onSave,
  onSubmittingChange,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState<"form" | "items">("form");

  const defaults = useMemo<ExchangeFormValues>(
    () => ({
      exchangeRate: initialValue(templateData.exchangeRate, todayIsoDate),
      exchangeDate: initialDateValue(templateData.exchangeDate, todayIsoDate),
      outAmount: initialValue(templateData.outAmount, todayIsoDate),
      outCurrencyId: initialValue(templateData.outCurrencyId, todayIsoDate),
      inAmount: initialValue(templateData.inAmount, todayIsoDate),
      inCurrencyId: initialValue(templateData.inCurrencyId, todayIsoDate),
      description: initialValue(templateData.description, todayIsoDate),
      tags: initialTagsValue(templateData.tags),
      transactionItems: [],
    }),
    [templateData, todayIsoDate],
  );

  const form = useForm<ExchangeFormValues>({ defaultValues: defaults });
  const outCurrencyId = useWatch({ control: form.control, name: "outCurrencyId" });
  const selectedCurrencyCode = currencyOptions.find((item) => item.value === outCurrencyId)?.label;

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const submit = async (values: ExchangeFormValues) => {
    setIsSubmitting(true);
    onSubmittingChange?.(true);
    setError(null);

    try {
      const exchangeRate = Number(resolve(templateData.exchangeRate, values.exchangeRate, todayIsoDate) || "0");
      const exchangeDate = resolveDate(templateData.exchangeDate, values.exchangeDate, todayIsoDate);
      const outAmount = Number(resolve(templateData.outAmount, values.outAmount, todayIsoDate) || "0");
      const outCurrencyId = resolve(templateData.outCurrencyId, values.outCurrencyId, todayIsoDate);
      const inAmount = Number(resolve(templateData.inAmount, values.inAmount, todayIsoDate) || "0");
      const inCurrencyId = resolve(templateData.inCurrencyId, values.inCurrencyId, todayIsoDate);
      const description = resolveOptionalDescription(templateData.description, values.description, todayIsoDate);
      const tags = resolveTags(templateData.tags, values.tags);
      const transactionItems = values.transactionItems
        .filter((item) => item.name.trim().length > 0)
        .map((item) => ({ name: item.name.trim(), amount: Number(item.amount || "0") }));
      const payload = {
        description: description ?? null,
        exchangeDate,
        exchangeRate,
        inLeg: {
          amount: inAmount,
          currencyId: inCurrencyId,
          description: description ?? undefined,
        },
        outLeg: {
          amount: outAmount,
          currencyId: outCurrencyId,
          description: description ?? undefined,
        },
        tags,
        transactionItems,
      };

      const record: Omit<OfflineTransactionRecord, "updatedAt"> = {
        amount: outAmount,
        bankAccountStatus: null,
        bankAccountTransactionType: null,
        bankName: null,
        counterpartyName: null,
        currencyCode: currencyOptions.find((item) => item.value === outCurrencyId)?.label ?? outCurrencyId,
        description: payload.description ?? "",
        direction: 2,
        exchangeId: crypto.randomUUID(),
        id: crypto.randomUUID(),
        isActive: true,
        payloadJson: JSON.stringify(payload),
        tags: payload.tags ?? [],
        transactionDate: payload.exchangeDate,
        transferId: null,
        transferStatus: null,
        transferType: null,
        type: "Exchange",
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
        itemsContent={<TransactionItemsEditor control={form.control} name="transactionItems" disabled={isSubmitting} currencyCode={selectedCurrencyCode} />}
        formContent={<Grid container spacing={2}>
        {shown(templateData.exchangeDate) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              control={form.control}
              name="exchangeDate"
              label={t("transactions.exchangeDate")}
              required={isRequired(templateData.exchangeDate)}
              rules={isRequired(templateData.exchangeDate) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
            />
          </Grid>
        ) : null}
        {shown(templateData.exchangeRate) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <NumberInput control={form.control} name="exchangeRate" label={t("transactions.exchangeRate")} />
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
        {shown(templateData.outAmount) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <NumberInput
              control={form.control}
              name="outAmount"
              label={t("transactions.outAmount")}
              required={isRequired(templateData.outAmount)}
              rules={isRequired(templateData.outAmount) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
            />
          </Grid>
        ) : null}
        {shown(templateData.outCurrencyId) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <DropDown
              control={form.control}
              name="outCurrencyId"
              label={t("transactions.outCurrency")}
              options={currencyOptions}
              required={isRequired(templateData.outCurrencyId)}
              rules={isRequired(templateData.outCurrencyId) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
            />
          </Grid>
        ) : null}
        {shown(templateData.inAmount) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <NumberInput
              control={form.control}
              name="inAmount"
              label={t("transactions.inAmount")}
              required={isRequired(templateData.inAmount)}
              rules={isRequired(templateData.inAmount) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
            />
          </Grid>
        ) : null}
        {shown(templateData.inCurrencyId) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <DropDown
              control={form.control}
              name="inCurrencyId"
              label={t("transactions.inCurrency")}
              options={currencyOptions}
              required={isRequired(templateData.inCurrencyId)}
              rules={isRequired(templateData.inCurrencyId) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
            />
          </Grid>
        ) : null}
      </Grid>}
      />
    </Stack>
  );
}
