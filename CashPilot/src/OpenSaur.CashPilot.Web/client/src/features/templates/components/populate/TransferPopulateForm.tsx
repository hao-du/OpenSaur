import { Alert, Grid, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../../components/atoms/ActionButton";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number as NumberInput } from "../../../../components/atoms/Number";
import { TextArea } from "../../../../components/atoms/TextArea";
import type { TranslationKey } from "../../../settings/provider/translations";
import { saveTransferForm } from "../../../transactions/api/transactionsApi";

type TemplateField = { autoPopulate?: boolean; showUi?: boolean; value?: string };
type TemplateDataShape = { counterpartyId?: TemplateField; transferType?: TemplateField; status?: TemplateField; amount?: TemplateField; currencyId?: TemplateField; direction?: TemplateField; transactionDate?: TemplateField; dueDate?: TemplateField; description?: TemplateField; };
type FormValues = { counterpartyId: string; transferType: string; status: string; amount: string; currencyId: string; direction: string; transactionDate: string; dueDate: string; description: string };
type Props = { t: (key: TranslationKey) => string; todayIsoDate: string; currencyOptions: Array<{ label: string; value: string }>; counterpartyOptions: Array<{ label: string; value: string }>; templateData: TemplateDataShape; onSaved?: () => Promise<void> | void; onClose: () => void; };
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

export function TransferPopulateForm({ t, todayIsoDate, currencyOptions, counterpartyOptions, templateData, onSaved, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaults = useMemo<FormValues>(() => ({
    counterpartyId: initialValue(templateData.counterpartyId, todayIsoDate),
    transferType: initialValue(templateData.transferType, todayIsoDate),
    status: initialValue(templateData.status, todayIsoDate),
    amount: initialValue(templateData.amount, todayIsoDate),
    currencyId: initialValue(templateData.currencyId, todayIsoDate),
    direction: initialValue(templateData.direction, todayIsoDate),
    transactionDate: initialDateValue(templateData.transactionDate, todayIsoDate),
    dueDate: initialDateValue(templateData.dueDate, todayIsoDate),
    description: initialValue(templateData.description, todayIsoDate)
  }), [templateData, todayIsoDate]);
  const form = useForm<FormValues>({ defaultValues: defaults });
  useEffect(() => { form.reset(defaults); }, [defaults, form]);

  const submit = async (v: FormValues) => {
    setIsSubmitting(true); setError(null);
    try {
      const amount = globalThis.Number(resolve(templateData.amount, v.amount, todayIsoDate));
      const currencyId = resolve(templateData.currencyId, v.currencyId, todayIsoDate);
      const direction = globalThis.Number(resolve(templateData.direction, v.direction, todayIsoDate));
      const transactionDate = resolveDate(templateData.transactionDate, v.transactionDate, todayIsoDate);
      await saveTransferForm({
        counterpartyId: resolve(templateData.counterpartyId, v.counterpartyId, todayIsoDate),
        transferType: globalThis.Number(resolve(templateData.transferType, v.transferType, todayIsoDate)),
        status: globalThis.Number(resolve(templateData.status, v.status, todayIsoDate)),
        amount,
        currencyId,
        transactionDate,
        dueDate: resolveDate(templateData.dueDate, v.dueDate, todayIsoDate),
        description: resolve(templateData.description, v.description, todayIsoDate).trim().length > 0 ? resolve(templateData.description, v.description, todayIsoDate).trim() : undefined,
        isActive: true,
        details: [{ amount, currencyId, direction, transactionDate, isActive: true }]
      });
      await onSaved?.(); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save transaction."); } finally { setIsSubmitting(false); }
  };

  return (
    <Stack spacing={2} component="form" onSubmit={form.handleSubmit(submit)}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Grid container spacing={2}>
        {shown(templateData.counterpartyId) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="counterpartyId" label={t("transactions.counterparty")} options={counterpartyOptions} required={isRequired(templateData.counterpartyId)} rules={isRequired(templateData.counterpartyId) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.transferType) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="transferType" label={t("transactions.type")} options={[{ label: t("transactions.transferType.lend"), value: "1" }, { label: t("transactions.transferType.borrow"), value: "2" }, { label: t("transactions.transferType.give"), value: "3" }, { label: t("transactions.transferType.receive"), value: "4" }]} required={isRequired(templateData.transferType)} rules={isRequired(templateData.transferType) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.status) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="status" label={t("transactions.status")} options={[{ label: t("transactions.statusType.active"), value: "1" }, { label: t("transactions.statusType.completed"), value: "2" }, { label: t("transactions.statusType.cancelled"), value: "3" }]} required={isRequired(templateData.status)} rules={isRequired(templateData.status) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.amount) ? <Grid size={{ xs: 12, md: 6 }}><NumberInput control={form.control} name="amount" label={t("transactions.amount")} required={isRequired(templateData.amount)} rules={isRequired(templateData.amount) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.currencyId) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="currencyId" label={t("transactions.currency")} options={currencyOptions} required={isRequired(templateData.currencyId)} rules={isRequired(templateData.currencyId) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.direction) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="direction" label={t("transactions.direction")} options={[{ label: t("transactions.directionIn"), value: "1" }, { label: t("transactions.directionOut"), value: "2" }]} required={isRequired(templateData.direction)} rules={isRequired(templateData.direction) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.transactionDate) ? <Grid size={{ xs: 12, md: 6 }}><DatePicker control={form.control} name="transactionDate" label={t("transactions.transactionDate")} required={isRequired(templateData.transactionDate)} rules={isRequired(templateData.transactionDate) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.dueDate) ? <Grid size={{ xs: 12, md: 6 }}><DatePicker control={form.control} name="dueDate" label={t("transactions.dueDate")} /></Grid> : null}
        {shown(templateData.description) ? <Grid size={{ xs: 12 }}><TextArea control={form.control} name="description" label={t("transactions.description")} minRows={3} /></Grid> : null}
      </Grid>
      <Stack direction="row" justifyContent="flex-end"><ActionButton type="submit" disabled={isSubmitting}>{isSubmitting ? t("action.working") : t("transactions.create")}</ActionButton></Stack>
    </Stack>
  );
}


