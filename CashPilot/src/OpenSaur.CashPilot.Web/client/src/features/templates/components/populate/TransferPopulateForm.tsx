import { Alert, Grid, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number as NumberInput } from "../../../../components/atoms/Number";
import { TextArea } from "../../../../components/atoms/TextArea";
import type { TranslationKey } from "../../../settings/provider/translations";
import { useCreateTransferMutation } from "../../../transactions/hooks/transfer/useCreateTransferMutation";
import { TransactionItemsEditor } from "../../../transactions/components/TransactionItemsEditor";
import { TransactionFormTabs } from "../../../transactions/components/TransactionFormTabs";
import { TagAutocompleteMultiSelect } from "../../../tags/components/TagAutocompleteMultiSelect";
import type {
  OptionItem,
  TransferFormValues,
  TransferTemplateDataShape,
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
  counterpartyOptions: OptionItem[];
  templateData: TransferTemplateDataShape;
  onSaved?: () => Promise<void> | void;
  onClose: () => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
};
export function TransferPopulateForm({
  formId,
  t,
  todayIsoDate,
  currencyOptions,
  counterpartyOptions,
  templateData,
  onSaved,
  onClose,
  onSubmittingChange,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState<"form" | "items">("form");
  const createTransferMutation = useCreateTransferMutation();
  const defaults = useMemo<TransferFormValues>(
    () => ({
      counterpartyId: initialValue(templateData.counterpartyId, todayIsoDate) || counterpartyOptions[0]?.value || "",
      transferType: initialValue(templateData.transferType, todayIsoDate),
      status: initialValue(templateData.status, todayIsoDate),
      amount: initialValue(templateData.amount, todayIsoDate),
      currencyId: initialValue(templateData.currencyId, todayIsoDate),
      direction: initialValue(templateData.direction, todayIsoDate),
      transactionDate: initialDateValue(
        templateData.transactionDate,
        todayIsoDate,
      ),
      dueDate: initialDateValue(templateData.dueDate, todayIsoDate),
      description: initialValue(templateData.description, todayIsoDate),
      tags: initialTagsValue(templateData.tags),
      transactionItems: [],
    }),
    [counterpartyOptions, templateData, todayIsoDate],
  );
  const form = useForm<TransferFormValues>({ defaultValues: defaults });
  const currencyId = useWatch({ control: form.control, name: "currencyId" });
  const selectedCurrencyCode = currencyOptions.find(x => x.value === currencyId)?.label;
  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const submit = async (v: TransferFormValues) => {
    setIsSubmitting(true);
    onSubmittingChange?.(true);
    setError(null);
    try {
      const amount = globalThis.Number(
        resolve(templateData.amount, v.amount, todayIsoDate),
      );
      const currencyId = resolve(
        templateData.currencyId,
        v.currencyId,
        todayIsoDate,
      );
      const direction = globalThis.Number(
        resolve(templateData.direction, v.direction, todayIsoDate),
      );
      const transactionDate = resolveDate(
        templateData.transactionDate,
        v.transactionDate,
        todayIsoDate,
      );
      const dueDate = resolveDate(templateData.dueDate, v.dueDate, todayIsoDate);
      await createTransferMutation.mutateAsync({
        counterpartyId: resolve(
          templateData.counterpartyId,
          v.counterpartyId,
          todayIsoDate,
        ),
        transferType: globalThis.Number(
          resolve(templateData.transferType, v.transferType, todayIsoDate),
        ),
        status: globalThis.Number(
          resolve(templateData.status, v.status, todayIsoDate),
        ),
        amount,
        currencyId,
        transactionDate,
        dueDate: dueDate.trim().length > 0 ? dueDate : undefined,
        description: resolveOptionalDescription(
          templateData.description,
          v.description,
          todayIsoDate,
        ),
        tags: resolveTags(templateData.tags, v.tags),
        details: [
          { amount, currencyId, direction, transactionDate, isActive: true },
        ],
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
        {shown(templateData.counterpartyId) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <DropDown
              control={form.control}
              name="counterpartyId"
              label={t("transactions.counterparty")}
              options={counterpartyOptions}
              required={isRequired(templateData.counterpartyId)}
              rules={
                isRequired(templateData.counterpartyId)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
            />
          </Grid>
        ) : null}
        {shown(templateData.transferType) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <DropDown
              control={form.control}
              name="transferType"
              label={t("transactions.type")}
              options={[
                { label: t("transactions.transferType.lend"), value: "1" },
                { label: t("transactions.transferType.borrow"), value: "2" },
                { label: t("transactions.transferType.give"), value: "3" },
                { label: t("transactions.transferType.receive"), value: "4" },
              ]}
              required={isRequired(templateData.transferType)}
              rules={
                isRequired(templateData.transferType)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
            />
          </Grid>
        ) : null}
        {shown(templateData.status) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <DropDown
              control={form.control}
              name="status"
              label={t("transactions.status")}
              options={[
                { label: t("transactions.statusType.active"), value: "1" },
                { label: t("transactions.statusType.completed"), value: "2" },
                { label: t("transactions.statusType.cancelled"), value: "3" },
              ]}
              required={isRequired(templateData.status)}
              rules={
                isRequired(templateData.status)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
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
        {shown(templateData.direction) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <DropDown
              control={form.control}
              name="direction"
              label={t("transactions.direction")}
              options={[
                { label: t("transactions.directionIn"), value: "1" },
                { label: t("transactions.directionOut"), value: "2" },
              ]}
              required={isRequired(templateData.direction)}
              rules={
                isRequired(templateData.direction)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
            />
          </Grid>
        ) : null}
        {shown(templateData.transactionDate) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              control={form.control}
              name="transactionDate"
              label={t("transactions.transactionDate")}
              required={isRequired(templateData.transactionDate)}
              rules={
                isRequired(templateData.transactionDate)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
            />
          </Grid>
        ) : null}
        {shown(templateData.dueDate) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              control={form.control}
              name="dueDate"
              label={t("transactions.dueDate")}
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



