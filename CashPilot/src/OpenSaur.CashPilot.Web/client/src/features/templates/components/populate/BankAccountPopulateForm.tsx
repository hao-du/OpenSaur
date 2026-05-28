import { Alert, Grid, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../../components/atoms/ActionButton";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number as NumberInput } from "../../../../components/atoms/Number";
import { Text } from "../../../../components/atoms/Text";
import { TextArea } from "../../../../components/atoms/TextArea";
import type { TranslationKey } from "../../../settings/provider/translations";
import { saveBankAccountForm } from "../../../transactions/api/transactionsApi";

type TemplateField = { autoPopulate?: boolean; showUi?: boolean; value?: string };
type TemplateDataShape = { bankId?: TemplateField; accountNumber?: TemplateField; status?: TemplateField; amount?: TemplateField; currencyId?: TemplateField; interestRate?: TemplateField; startDate?: TemplateField; maturityDate?: TemplateField; description?: TemplateField; };
type FormValues = { bankId: string; accountNumber: string; status: string; amount: string; currencyId: string; interestRate: string; startDate: string; maturityDate: string; description: string };
type Props = { t: (key: TranslationKey) => string; todayIsoDate: string; currencyOptions: Array<{ label: string; value: string }>; bankOptions: Array<{ label: string; value: string }>; templateData: TemplateDataShape; onSaved?: () => Promise<void> | void; onClose: () => void; };
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

export function BankAccountPopulateForm({ t, todayIsoDate, currencyOptions, bankOptions, templateData, onSaved, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaults = useMemo<FormValues>(() => ({
    bankId: initialValue(templateData.bankId, todayIsoDate),
    accountNumber: initialValue(templateData.accountNumber, todayIsoDate),
    status: initialValue(templateData.status, todayIsoDate),
    amount: initialValue(templateData.amount, todayIsoDate),
    currencyId: initialValue(templateData.currencyId, todayIsoDate),
    interestRate: initialValue(templateData.interestRate, todayIsoDate),
    startDate: initialDateValue(templateData.startDate, todayIsoDate),
    maturityDate: initialDateValue(templateData.maturityDate, todayIsoDate),
    description: initialValue(templateData.description, todayIsoDate)
  }), [templateData, todayIsoDate]);
  const form = useForm<FormValues>({ defaultValues: defaults });
  const statusValue = form.watch("status");
  useEffect(() => { form.reset(defaults); }, [defaults, form]);
  const isMaturedStatus = resolve(templateData.status, statusValue, todayIsoDate) === "2";

  const submit = async (v: FormValues) => {
    setIsSubmitting(true); setError(null);
    try {
      await saveBankAccountForm({
        bankId: resolve(templateData.bankId, v.bankId, todayIsoDate),
        accountNumber: resolve(templateData.accountNumber, v.accountNumber, todayIsoDate),
        status: globalThis.Number(resolve(templateData.status, v.status, todayIsoDate)),
        amount: globalThis.Number(resolve(templateData.amount, v.amount, todayIsoDate)),
        currencyId: resolve(templateData.currencyId, v.currencyId, todayIsoDate),
        interestRate: globalThis.Number(resolve(templateData.interestRate, v.interestRate, todayIsoDate)),
        startDate: resolveDate(templateData.startDate, v.startDate, todayIsoDate),
        maturityDate: resolveDate(templateData.maturityDate, v.maturityDate, todayIsoDate),
        description: resolve(templateData.description, v.description, todayIsoDate).trim().length > 0 ? resolve(templateData.description, v.description, todayIsoDate).trim() : undefined,
        isActive: true,
        details: []
      });
      await onSaved?.(); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save transaction."); } finally { setIsSubmitting(false); }
  };

  return (
    <Stack spacing={2} component="form" onSubmit={form.handleSubmit(submit)}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Grid container spacing={2}>
        {shown(templateData.accountNumber) ? <Grid size={{ xs: 12 }}><Text control={form.control} name="accountNumber" label={t("transactions.accountNumber")} /></Grid> : null}
        {shown(templateData.bankId) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="bankId" label={t("transactions.bank")} options={bankOptions} required={isRequired(templateData.bankId)} rules={isRequired(templateData.bankId) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.interestRate) ? <Grid size={{ xs: 12, md: 6 }}><NumberInput control={form.control} name="interestRate" label={t("transactions.interestRate")} /></Grid> : null}
        {shown(templateData.amount) ? <Grid size={{ xs: 12, md: 6 }}><NumberInput control={form.control} name="amount" label={t("transactions.amount")} required={isRequired(templateData.amount)} rules={isRequired(templateData.amount) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.currencyId) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="currencyId" label={t("transactions.currency")} options={currencyOptions} required={isRequired(templateData.currencyId)} rules={isRequired(templateData.currencyId) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.startDate) ? <Grid size={{ xs: 12, md: 6 }}><DatePicker control={form.control} name="startDate" label={t("transactions.startDate")} required={isRequired(templateData.startDate)} rules={isRequired(templateData.startDate) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.maturityDate) ? <Grid size={{ xs: 12, md: 6 }}><DatePicker control={form.control} name="maturityDate" label={t("transactions.maturityDate")} required={isMaturedStatus} rules={isMaturedStatus ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.status) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="status" label={t("transactions.status")} options={[{ label: t("transactions.statusType.active"), value: "1" }, { label: t("transactions.statusType.matured"), value: "2" }, { label: t("transactions.statusType.closedEarly"), value: "3" }]} required={isRequired(templateData.status)} rules={isRequired(templateData.status) ? { required: "This field is required." } : undefined} /></Grid> : null}
        {shown(templateData.description) ? <Grid size={{ xs: 12 }}><TextArea control={form.control} name="description" label={t("transactions.description")} minRows={3} /></Grid> : null}
      </Grid>
      <Stack direction="row" justifyContent="flex-end"><ActionButton type="submit" disabled={isSubmitting}>{isSubmitting ? t("action.working") : t("transactions.create")}</ActionButton></Stack>
    </Stack>
  );
}


