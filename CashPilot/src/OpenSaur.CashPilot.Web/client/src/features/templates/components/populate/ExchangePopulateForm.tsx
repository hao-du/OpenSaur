import { Alert, Grid, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../../components/atoms/ActionButton";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number as NumberInput } from "../../../../components/atoms/Number";
import { TextArea } from "../../../../components/atoms/TextArea";
import type { TranslationKey } from "../../../settings/provider/translations";
import { createCurrencyExchange } from "../../../transactions/api/transactionsApi";

type TemplateField = { autoPopulate?: boolean; showUi?: boolean; value?: string };
type TemplateDataShape = {
  exchangeRate?: TemplateField; exchangeDate?: TemplateField; outAmount?: TemplateField; outCurrencyId?: TemplateField; inAmount?: TemplateField; inCurrencyId?: TemplateField; description?: TemplateField;
};
type FormValues = { exchangeRate: string; exchangeDate: string; outAmount: string; outCurrencyId: string; inAmount: string; inCurrencyId: string; description: string };
type Props = { t: (key: TranslationKey) => string; todayIsoDate: string; currencyOptions: Array<{ label: string; value: string }>; templateData: TemplateDataShape; onSaved?: () => Promise<void> | void; onClose: () => void; };
const shown = (f?: TemplateField) => f?.showUi === true;
const resolve = (f: TemplateField | undefined, v: string) => (f?.autoPopulate === true && !f?.showUi ? (f.value ?? "") : v);

export function ExchangePopulateForm({ t, todayIsoDate, currencyOptions, templateData, onSaved, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaults = useMemo<FormValues>(() => ({
    exchangeRate: templateData.exchangeRate?.autoPopulate ? (templateData.exchangeRate.value ?? "") : "",
    exchangeDate: templateData.exchangeDate?.autoPopulate ? (templateData.exchangeDate.value ?? "") : "",
    outAmount: templateData.outAmount?.autoPopulate ? (templateData.outAmount.value ?? "") : "",
    outCurrencyId: templateData.outCurrencyId?.autoPopulate ? (templateData.outCurrencyId.value ?? "") : "",
    inAmount: templateData.inAmount?.autoPopulate ? (templateData.inAmount.value ?? "") : "",
    inCurrencyId: templateData.inCurrencyId?.autoPopulate ? (templateData.inCurrencyId.value ?? "") : "",
    description: templateData.description?.autoPopulate ? (templateData.description.value ?? "") : ""
  }), [templateData]);
  const form = useForm<FormValues>({ defaultValues: defaults });
  useEffect(() => { form.reset(defaults); }, [defaults, form]);

  const validate = (v: FormValues) => {
    const req = (f?: TemplateField, val?: string) => f?.showUi === true || (f?.autoPopulate === true && !f?.showUi) ? (resolve(f, val ?? "").trim().length > 0) : true;
    if (!req(templateData.exchangeRate, v.exchangeRate) || !req(templateData.exchangeDate, v.exchangeDate) || !req(templateData.outAmount, v.outAmount) || !req(templateData.outCurrencyId, v.outCurrencyId) || !req(templateData.inAmount, v.inAmount) || !req(templateData.inCurrencyId, v.inCurrencyId)) return "Please fill all required fields.";
    return null;
  };

  const submit = async (v: FormValues) => {
    const err = validate(v); if (err) { setError(err); return; }
    setIsSubmitting(true); setError(null);
    try {
      await createCurrencyExchange({
        exchangeRate: globalThis.Number(resolve(templateData.exchangeRate, v.exchangeRate)),
        exchangeDate: resolve(templateData.exchangeDate, v.exchangeDate) || todayIsoDate,
        outLeg: { amount: globalThis.Number(resolve(templateData.outAmount, v.outAmount)), currencyId: resolve(templateData.outCurrencyId, v.outCurrencyId) },
        inLeg: { amount: globalThis.Number(resolve(templateData.inAmount, v.inAmount)), currencyId: resolve(templateData.inCurrencyId, v.inCurrencyId) },
        description: resolve(templateData.description, v.description).trim().length > 0 ? resolve(templateData.description, v.description).trim() : undefined
      });
      await onSaved?.(); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save transaction."); } finally { setIsSubmitting(false); }
  };

  return (
    <Stack spacing={2} component="form" onSubmit={form.handleSubmit(submit)}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Grid container spacing={2}>
        {shown(templateData.exchangeRate) ? <Grid size={{ xs: 12, md: 6 }}><NumberInput control={form.control} name="exchangeRate" label={t("transactions.exchangeRate")} required /></Grid> : null}
        {shown(templateData.exchangeDate) ? <Grid size={{ xs: 12, md: 6 }}><DatePicker control={form.control} name="exchangeDate" label={t("transactions.exchangeDate")} required /></Grid> : null}
        {shown(templateData.outAmount) ? <Grid size={{ xs: 12, md: 6 }}><NumberInput control={form.control} name="outAmount" label={t("transactions.outAmount")} required /></Grid> : null}
        {shown(templateData.outCurrencyId) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="outCurrencyId" label={t("transactions.outCurrency")} options={currencyOptions} required /></Grid> : null}
        {shown(templateData.inAmount) ? <Grid size={{ xs: 12, md: 6 }}><NumberInput control={form.control} name="inAmount" label={t("transactions.inAmount")} required /></Grid> : null}
        {shown(templateData.inCurrencyId) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="inCurrencyId" label={t("transactions.inCurrency")} options={currencyOptions} required /></Grid> : null}
        {shown(templateData.description) ? <Grid size={{ xs: 12 }}><TextArea control={form.control} name="description" label={t("transactions.description")} minRows={3} /></Grid> : null}
      </Grid>
      <Stack direction="row" justifyContent="flex-end"><ActionButton type="submit" disabled={isSubmitting}>{isSubmitting ? t("action.working") : t("transactions.create")}</ActionButton></Stack>
    </Stack>
  );
}


