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
const resolve = (f: TemplateField | undefined, v: string) => (f?.autoPopulate === true && !f?.showUi ? (f.value ?? "") : v);

export function TransferPopulateForm({ t, todayIsoDate, currencyOptions, counterpartyOptions, templateData, onSaved, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaults = useMemo<FormValues>(() => ({
    counterpartyId: templateData.counterpartyId?.autoPopulate ? (templateData.counterpartyId.value ?? "") : "",
    transferType: templateData.transferType?.autoPopulate ? (templateData.transferType.value ?? "") : "",
    status: templateData.status?.autoPopulate ? (templateData.status.value ?? "") : "",
    amount: templateData.amount?.autoPopulate ? (templateData.amount.value ?? "") : "",
    currencyId: templateData.currencyId?.autoPopulate ? (templateData.currencyId.value ?? "") : "",
    direction: templateData.direction?.autoPopulate ? (templateData.direction.value ?? "") : "",
    transactionDate: templateData.transactionDate?.autoPopulate ? (templateData.transactionDate.value ?? "") : "",
    dueDate: templateData.dueDate?.autoPopulate ? (templateData.dueDate.value ?? "") : "",
    description: templateData.description?.autoPopulate ? (templateData.description.value ?? "") : ""
  }), [templateData]);
  const form = useForm<FormValues>({ defaultValues: defaults });
  useEffect(() => { form.reset(defaults); }, [defaults, form]);

  const validate = (v: FormValues) => {
    const req = (f?: TemplateField, val?: string) => f?.showUi === true || (f?.autoPopulate === true && !f?.showUi) ? (resolve(f, val ?? "").trim().length > 0) : true;
    if (!req(templateData.counterpartyId, v.counterpartyId) || !req(templateData.transferType, v.transferType) || !req(templateData.status, v.status) || !req(templateData.amount, v.amount) || !req(templateData.currencyId, v.currencyId) || !req(templateData.direction, v.direction) || !req(templateData.transactionDate, v.transactionDate) || !req(templateData.dueDate, v.dueDate)) return "Please fill all required fields.";
    return null;
  };

  const submit = async (v: FormValues) => {
    const err = validate(v); if (err) { setError(err); return; }
    setIsSubmitting(true); setError(null);
    try {
      const amount = globalThis.Number(resolve(templateData.amount, v.amount));
      const currencyId = resolve(templateData.currencyId, v.currencyId);
      const direction = globalThis.Number(resolve(templateData.direction, v.direction));
      const transactionDate = resolve(templateData.transactionDate, v.transactionDate) || todayIsoDate;
      await saveTransferForm({
        counterpartyId: resolve(templateData.counterpartyId, v.counterpartyId),
        transferType: globalThis.Number(resolve(templateData.transferType, v.transferType)),
        status: globalThis.Number(resolve(templateData.status, v.status)),
        amount,
        currencyId,
        transactionDate,
        dueDate: resolve(templateData.dueDate, v.dueDate),
        description: resolve(templateData.description, v.description).trim().length > 0 ? resolve(templateData.description, v.description).trim() : undefined,
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
        {shown(templateData.counterpartyId) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="counterpartyId" label={t("transactions.counterparty")} options={counterpartyOptions} required /></Grid> : null}
        {shown(templateData.transferType) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="transferType" label={t("transactions.type")} options={[{ label: t("transactions.transferType.lend"), value: "1" }, { label: t("transactions.transferType.borrow"), value: "2" }, { label: t("transactions.transferType.give"), value: "3" }, { label: t("transactions.transferType.receive"), value: "4" }]} required /></Grid> : null}
        {shown(templateData.status) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="status" label={t("transactions.status")} options={[{ label: t("transactions.statusType.active"), value: "1" }, { label: t("transactions.statusType.completed"), value: "2" }, { label: t("transactions.statusType.cancelled"), value: "3" }]} required /></Grid> : null}
        {shown(templateData.amount) ? <Grid size={{ xs: 12, md: 6 }}><NumberInput control={form.control} name="amount" label={t("transactions.amount")} required /></Grid> : null}
        {shown(templateData.currencyId) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="currencyId" label={t("transactions.currency")} options={currencyOptions} required /></Grid> : null}
        {shown(templateData.direction) ? <Grid size={{ xs: 12, md: 6 }}><DropDown control={form.control} name="direction" label={t("transactions.direction")} options={[{ label: t("transactions.directionIn"), value: "1" }, { label: t("transactions.directionOut"), value: "2" }]} required /></Grid> : null}
        {shown(templateData.transactionDate) ? <Grid size={{ xs: 12, md: 6 }}><DatePicker control={form.control} name="transactionDate" label={t("transactions.transactionDate")} required /></Grid> : null}
        {shown(templateData.dueDate) ? <Grid size={{ xs: 12, md: 6 }}><DatePicker control={form.control} name="dueDate" label={t("transactions.dueDate")} required /></Grid> : null}
        {shown(templateData.description) ? <Grid size={{ xs: 12 }}><TextArea control={form.control} name="description" label={t("transactions.description")} minRows={3} /></Grid> : null}
      </Grid>
      <Stack direction="row" justifyContent="flex-end"><ActionButton type="submit" disabled={isSubmitting}>{isSubmitting ? t("action.working") : t("transactions.create")}</ActionButton></Stack>
    </Stack>
  );
}


