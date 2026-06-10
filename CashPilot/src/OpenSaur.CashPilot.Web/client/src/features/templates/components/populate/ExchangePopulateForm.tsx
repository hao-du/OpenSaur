import { Alert, Grid, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { PageTitleText } from "../../../../components/atoms/PageTitleText";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number as NumberInput } from "../../../../components/atoms/Number";
import { TextArea } from "../../../../components/atoms/TextArea";
import type { TranslationKey } from "../../../settings/provider/translations";
import { useCreateCurrencyExchangeMutation } from "../../../transactions/hooks/useCreateCurrencyExchangeMutation";
import { TransactionItemsEditor } from "../../../transactions/components/TransactionItemsEditor";
import { TransactionFormTabs } from "../../../transactions/components/TransactionFormTabs";
import { TagAutocompleteMultiSelect } from "../../../tags/components/TagAutocompleteMultiSelect";
import type {
  ExchangeFormValues,
  ExchangeTemplateDataShape,
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
  templateData: ExchangeTemplateDataShape;
  onSaved?: () => Promise<void> | void;
  onClose: () => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
};
export function ExchangePopulateForm({
  formId,
  t,
  todayIsoDate,
  currencyOptions,
  templateData,
  onSaved,
  onClose,
  onSubmittingChange,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState<"form" | "items">("form");
  const createCurrencyExchangeMutation = useCreateCurrencyExchangeMutation();
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
  const selectedCurrencyCode = currencyOptions.find(x => x.value === outCurrencyId)?.label;
  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const submit = async (v: ExchangeFormValues) => {
    setIsSubmitting(true);
    onSubmittingChange?.(true);
    setError(null);
    try {
      await createCurrencyExchangeMutation.mutateAsync({
        exchangeRate: globalThis.Number(
          resolve(templateData.exchangeRate, v.exchangeRate, todayIsoDate),
        ),
        exchangeDate: resolveDate(
          templateData.exchangeDate,
          v.exchangeDate,
          todayIsoDate,
        ),
        outLeg: {
          amount: globalThis.Number(
            resolve(templateData.outAmount, v.outAmount, todayIsoDate),
          ),
          currencyId: resolve(
            templateData.outCurrencyId,
            v.outCurrencyId,
            todayIsoDate,
          ),
        },
        inLeg: {
          amount: globalThis.Number(
            resolve(templateData.inAmount, v.inAmount, todayIsoDate),
          ),
          currencyId: resolve(
            templateData.inCurrencyId,
            v.inCurrencyId,
            todayIsoDate,
          ),
        },
        description: resolveOptionalDescription(
          templateData.description,
          v.description,
          todayIsoDate,
        ),
        tags: resolveTags(templateData.tags, v.tags),
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
        {shown(templateData.exchangeDate) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              control={form.control}
              name="exchangeDate"
              label={t("transactions.exchangeDate")}
              required={isRequired(templateData.exchangeDate)}
              rules={
                isRequired(templateData.exchangeDate)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
            />
          </Grid>
        ) : null}
        {shown(templateData.exchangeRate) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <NumberInput
              control={form.control}
              name="exchangeRate"
              label={t("transactions.exchangeRate")}
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
        <Grid size={{ xs: 12 }}>
          <PageTitleText variant="h6">Exchange Legs</PageTitleText>
        </Grid>
        {shown(templateData.outAmount) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <NumberInput
              control={form.control}
              name="outAmount"
              label={t("transactions.outAmount")}
              required={isRequired(templateData.outAmount)}
              rules={
                isRequired(templateData.outAmount)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
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
              rules={
                isRequired(templateData.outCurrencyId)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
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
              rules={
                isRequired(templateData.inAmount)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
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
              rules={
                isRequired(templateData.inCurrencyId)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
            />
          </Grid>
        ) : null}
      </Grid>}
      />
    </Stack>
  );
}
