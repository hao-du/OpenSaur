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
const resolve = (f: TemplateField | undefined, v: string) => (f?.autoPopulate === true && !f?.showUi ? (f.value ?? "") : v);

export function CashFlowPopulateForm({ t, todayIsoDate, currencyOptions, templateData, onSaved, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaults = useMemo<FormValues>(() => ({
    amount: templateData.amount?.autoPopulate ? (templateData.amount.value ?? "") : "",
    currencyId: templateData.currencyId?.autoPopulate ? (templateData.currencyId.value ?? "") : "",
    direction: templateData.direction?.autoPopulate ? (templateData.direction.value ?? "") : "",
    transactionDate: templateData.transactionDate?.autoPopulate ? (templateData.transactionDate.value ?? "") : "",
    description: templateData.description?.autoPopulate ? (templateData.description.value ?? "") : ""
  }), [templateData]);
  const form = useForm<FormValues>({ defaultValues: defaults });

  useEffect(() => { form.reset(defaults); }, [defaults, form]);

  const validate = (v: FormValues) => {
    const required = (f?: TemplateField, value?: string) => f?.showUi === true || (f?.autoPopulate === true && !f?.showUi) ? (resolve(f, value ?? "").trim().length > 0) : true;
    if (!required(templateData.amount, v.amount) || !required(templateData.currencyId, v.currencyId) || !required(templateData.direction, v.direction) || !required(templateData.transactionDate, v.transactionDate)) {
      return "Please fill all required fields.";
    }
    return null;
  };

  const submit = async (v: FormValues) => {
    const err = validate(v);
    if (err != null) {
      setError(err);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await createCashFlow({
        amount: globalThis.Number(resolve(templateData.amount, v.amount)),
        currencyId: resolve(templateData.currencyId, v.currencyId),
        direction: globalThis.Number(resolve(templateData.direction, v.direction)),
        transactionDate: resolve(templateData.transactionDate, v.transactionDate) || todayIsoDate,
        description: resolve(templateData.description, v.description).trim().length > 0 ? resolve(templateData.description, v.description).trim() : undefined
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
        {shown(templateData.amount) ? <Grid size={{ xs: 12, md: 6 }}><NumberInput control={form.control} name="amount" label={t("transactions.amount")} required /></Grid> : null}
        {shown(templateData.currencyId) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="currencyId" label={t("transactions.currency")} options={currencyOptions} required /></Grid> : null}
        {shown(templateData.direction) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="direction" label={t("transactions.direction")} options={[{ label: t("transactions.directionIn"), value: "1" }, { label: t("transactions.directionOut"), value: "2" }]} required /></Grid> : null}
        {shown(templateData.transactionDate) ? <Grid size={{ xs: 12, md: 6 }}><DatePicker control={form.control} name="transactionDate" label={t("transactions.transactionDate")} required /></Grid> : null}
        {shown(templateData.description) ? <Grid size={{ xs: 12 }}><TextArea control={form.control} name="description" label={t("transactions.description")} minRows={3} /></Grid> : null}
      </Grid>
      <Stack direction="row" justifyContent="flex-end">
        <ActionButton type="submit" disabled={isSubmitting}>{isSubmitting ? t("action.working") : t("transactions.create")}</ActionButton>
      </Stack>
    </Stack>
  );
}


