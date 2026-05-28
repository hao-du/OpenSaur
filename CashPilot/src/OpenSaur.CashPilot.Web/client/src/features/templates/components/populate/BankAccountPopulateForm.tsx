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
const resolve = (f: TemplateField | undefined, v: string) => (f?.autoPopulate === true && !f?.showUi ? (f.value ?? "") : v);

export function BankAccountPopulateForm({ t, todayIsoDate, currencyOptions, bankOptions, templateData, onSaved, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaults = useMemo<FormValues>(() => ({
    bankId: templateData.bankId?.autoPopulate ? (templateData.bankId.value ?? "") : "",
    accountNumber: templateData.accountNumber?.autoPopulate ? (templateData.accountNumber.value ?? "") : "",
    status: templateData.status?.autoPopulate ? (templateData.status.value ?? "") : "",
    amount: templateData.amount?.autoPopulate ? (templateData.amount.value ?? "") : "",
    currencyId: templateData.currencyId?.autoPopulate ? (templateData.currencyId.value ?? "") : "",
    interestRate: templateData.interestRate?.autoPopulate ? (templateData.interestRate.value ?? "") : "",
    startDate: templateData.startDate?.autoPopulate ? (templateData.startDate.value ?? "") : "",
    maturityDate: templateData.maturityDate?.autoPopulate ? (templateData.maturityDate.value ?? "") : "",
    description: templateData.description?.autoPopulate ? (templateData.description.value ?? "") : ""
  }), [templateData]);
  const form = useForm<FormValues>({ defaultValues: defaults });
  useEffect(() => { form.reset(defaults); }, [defaults, form]);

  const validate = (v: FormValues) => {
    const req = (f?: TemplateField, val?: string) => f?.showUi === true || (f?.autoPopulate === true && !f?.showUi) ? (resolve(f, val ?? "").trim().length > 0) : true;
    if (!req(templateData.bankId, v.bankId) || !req(templateData.accountNumber, v.accountNumber) || !req(templateData.status, v.status) || !req(templateData.amount, v.amount) || !req(templateData.currencyId, v.currencyId) || !req(templateData.interestRate, v.interestRate) || !req(templateData.startDate, v.startDate) || !req(templateData.maturityDate, v.maturityDate)) return "Please fill all required fields.";
    return null;
  };

  const submit = async (v: FormValues) => {
    const err = validate(v); if (err) { setError(err); return; }
    setIsSubmitting(true); setError(null);
    try {
      await saveBankAccountForm({
        bankId: resolve(templateData.bankId, v.bankId),
        accountNumber: resolve(templateData.accountNumber, v.accountNumber),
        status: globalThis.Number(resolve(templateData.status, v.status)),
        amount: globalThis.Number(resolve(templateData.amount, v.amount)),
        currencyId: resolve(templateData.currencyId, v.currencyId),
        interestRate: globalThis.Number(resolve(templateData.interestRate, v.interestRate)),
        startDate: resolve(templateData.startDate, v.startDate) || todayIsoDate,
        maturityDate: resolve(templateData.maturityDate, v.maturityDate),
        description: resolve(templateData.description, v.description).trim().length > 0 ? resolve(templateData.description, v.description).trim() : undefined,
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
        {shown(templateData.bankId) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="bankId" label={t("transactions.bank")} options={bankOptions} required /></Grid> : null}
        {shown(templateData.accountNumber) ? <Grid size={{ xs: 12, md: 6 }}><Text control={form.control} name="accountNumber" label={t("transactions.accountNumber")} required /></Grid> : null}
        {shown(templateData.status) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="status" label={t("transactions.status")} options={[{ label: t("transactions.statusType.active"), value: "1" }, { label: t("transactions.statusType.matured"), value: "2" }, { label: t("transactions.statusType.closedEarly"), value: "3" }]} required /></Grid> : null}
        {shown(templateData.amount) ? <Grid size={{ xs: 12, md: 6 }}><NumberInput control={form.control} name="amount" label={t("transactions.amount")} required /></Grid> : null}
        {shown(templateData.currencyId) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="currencyId" label={t("transactions.currency")} options={currencyOptions} required /></Grid> : null}
        {shown(templateData.interestRate) ? <Grid size={{ xs: 12, md: 6 }}><NumberInput control={form.control} name="interestRate" label={t("transactions.interestRate")} required /></Grid> : null}
        {shown(templateData.startDate) ? <Grid size={{ xs: 12, md: 6 }}><DatePicker control={form.control} name="startDate" label={t("transactions.startDate")} required /></Grid> : null}
        {shown(templateData.maturityDate) ? <Grid size={{ xs: 12, md: 6 }}><DatePicker control={form.control} name="maturityDate" label={t("transactions.maturityDate")} required /></Grid> : null}
        {shown(templateData.description) ? <Grid size={{ xs: 12 }}><TextArea control={form.control} name="description" label={t("transactions.description")} minRows={3} /></Grid> : null}
      </Grid>
      <Stack direction="row" justifyContent="flex-end"><ActionButton type="submit" disabled={isSubmitting}>{isSubmitting ? t("action.working") : t("transactions.create")}</ActionButton></Stack>
    </Stack>
  );
}


