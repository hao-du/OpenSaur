import { Alert, Grid, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../../components/atoms/ActionButton";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number as NumberInput } from "../../../../components/atoms/Number";
import { TextArea } from "../../../../components/atoms/TextArea";
import type { TranslationKey } from "../../../settings/provider/translations";
import { createCashFlow } from "../../../transactions/api/transactionsApi";

type TemplateField = { autoPopulate?: boolean; showUi?: boolean; value?: string };
type TemplateDataShape = {
  amount?: TemplateField;
  currencyId?: TemplateField;
  direction?: TemplateField;
  transactionDate?: TemplateField;
  description?: TemplateField;
};

type Props = {
  t: (key: TranslationKey) => string;
  todayIsoDate: string;
  currencyOptions: Array<{ label: string; value: string }>;
  templateData: TemplateDataShape;
  onSaved?: () => Promise<void> | void;
  onClose: () => void;
};

type FormValues = { amount: string; currencyId: string; direction: string; transactionDate: string; description: string };

const shown = (f?: TemplateField) => f?.showUi === true;
const replaceDateTokens = (value: string, todayIsoDate: string) => {
  const [year, month, day] = todayIsoDate.split("-");
  return value
    .replaceAll("{datetime-Day}", day ?? "")
    .replaceAll("{datetime-Month}", month ?? "")
    .replaceAll("{datetime-Year}", year ?? "");
};
const resolve = (f: TemplateField | undefined, v: string, todayIsoDate: string) => {
  const raw = f?.autoPopulate === true && !f?.showUi ? (f.value ?? "") : v;
  return replaceDateTokens(raw, todayIsoDate);
};
const resolveDate = (f: TemplateField | undefined, v: string, todayIsoDate: string) => (f?.autoPopulate === true ? todayIsoDate : resolve(f, v, todayIsoDate));
const initialValue = (f: TemplateField | undefined, todayIsoDate: string) => replaceDateTokens(f?.autoPopulate === true ? (f.value ?? "") : "", todayIsoDate);
const initialDateValue = (f: TemplateField | undefined, todayIsoDate: string) => (f?.autoPopulate === true ? todayIsoDate : "");
const isRequired = (f?: TemplateField) => f?.showUi === true || (f?.autoPopulate === true && !f?.showUi);

export function CashFlowPopulateForm({ t, todayIsoDate, currencyOptions, templateData, onSaved, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaults = useMemo<FormValues>(() => ({
    amount: initialValue(templateData.amount, todayIsoDate),
    currencyId: initialValue(templateData.currencyId, todayIsoDate),
    direction: initialValue(templateData.direction, todayIsoDate),
    transactionDate: initialDateValue(templateData.transactionDate, todayIsoDate),
    description: initialValue(templateData.description, todayIsoDate)
  }), [templateData, todayIsoDate]);
  const form = useForm<FormValues>({ defaultValues: defaults });

  useEffect(() => { form.reset(defaults); }, [defaults, form]);

  const submit = async (v: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createCashFlow({
        amount: globalThis.Number(resolve(templateData.amount, v.amount, todayIsoDate)),
        currencyId: resolve(templateData.currencyId, v.currencyId, todayIsoDate),
        direction: globalThis.Number(resolve(templateData.direction, v.direction, todayIsoDate)),
        transactionDate: resolveDate(templateData.transactionDate, v.transactionDate, todayIsoDate),
        description: resolve(templateData.description, v.description, todayIsoDate).trim().length > 0 ? resolve(templateData.description, v.description, todayIsoDate).trim() : undefined
      });
      await onSaved?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack spacing={2} component="form" onSubmit={form.handleSubmit(submit)}>
      {error != null ? <Alert severity="error">{error}</Alert> : null}
      <Grid container spacing={2}>
        {shown(templateData.amount) ? <Grid size={{ xs: 12 }}><NumberInput control={form.control} name="amount" label={t("transactions.amount")} required={isRequired(templateData.amount)} rules={isRequired(templateData.amount) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.currencyId) ? <Grid size={{ xs: 12 }}><DropDown control={form.control} name="currencyId" label={t("transactions.currency")} options={currencyOptions} required={isRequired(templateData.currencyId)} rules={isRequired(templateData.currencyId) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.direction) ? <Grid size={{ xs: 12 }}><DropDown control={form.control} name="direction" label={t("transactions.direction")} options={[{ label: t("transactions.directionIn"), value: "1" }, { label: t("transactions.directionOut"), value: "2" }]} required={isRequired(templateData.direction)} rules={isRequired(templateData.direction) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.transactionDate) ? <Grid size={{ xs: 12 }}><DatePicker control={form.control} name="transactionDate" label={t("transactions.transactionDate")} required={isRequired(templateData.transactionDate)} rules={isRequired(templateData.transactionDate) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.description) ? <Grid size={{ xs: 12 }}><TextArea control={form.control} name="description" label={t("transactions.description")} minRows={3} /></Grid> : null}
      </Grid>
      <Stack direction="row" justifyContent="flex-end">
        <ActionButton type="submit" disabled={isSubmitting}>{isSubmitting ? t("action.working") : t("transactions.create")}</ActionButton>
      </Stack>
    </Stack>
  );
}


