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
import type { CashFlowDetailDto } from "../../../transactions/dtos/TransactionDto";
import { transactionDirectionValues } from "../../../../infrastructure/constants/transactionEnums";
import type { OfflineTransactionRecord } from "../../storages/offlineTransactionsStore";
import type { CashFlowFormValues, CashFlowTemplateDataShape, OptionItem } from "./types";
import {
  initialDateValue,
  initialTagsValue,
  initialValue,
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
  templateData: CashFlowTemplateDataShape;
  onClose: () => void;
  onSave: (record: Omit<OfflineTransactionRecord, "updatedAt">) => Promise<void> | void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
};

export function OfflineCashFlowPopulateForm({
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

  const defaults = useMemo<CashFlowFormValues>(
    () => ({
      amount: initialValue(templateData.amount, todayIsoDate),
      currencyId: initialValue(templateData.currencyId, todayIsoDate),
      direction: initialValue(templateData.direction, todayIsoDate),
      transactionDate: initialDateValue(templateData.transactionDate, todayIsoDate),
      description: initialValue(templateData.description, todayIsoDate),
      tags: initialTagsValue(templateData.tags),
      transactionItems: [],
    }),
    [templateData, todayIsoDate],
  );

  const form = useForm<CashFlowFormValues>({ defaultValues: defaults });
  const currencyId = useWatch({ control: form.control, name: "currencyId" });
  const selectedCurrencyCode = currencyOptions.find((item) => item.value === currencyId)?.label;

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const submit = async (values: CashFlowFormValues) => {
    setIsSubmitting(true);
    onSubmittingChange?.(true);
    setError(null);

    try {
      const amount = Number(resolve(templateData.amount, values.amount, todayIsoDate) || "0");
      const currencyIdValue = resolve(templateData.currencyId, values.currencyId, todayIsoDate);
      const direction = Number(resolve(templateData.direction, values.direction, todayIsoDate) || String(transactionDirectionValues.outflow));
      const transactionDate = resolveDate(templateData.transactionDate, values.transactionDate, todayIsoDate);
      const description = resolveOptionalDescription(templateData.description, values.description, todayIsoDate);
      const tags = resolveTags(templateData.tags, values.tags);
      const transactionItems = values.transactionItems
        .filter((item) => item.name.trim().length > 0)
        .map((item) => ({ name: item.name.trim(), amount: Number(item.amount || "0") }));
      const payload: CashFlowDetailDto = {
        amount,
        currencyId: currencyIdValue,
        description: description ?? null,
        direction,
        id: crypto.randomUUID(),
        isActive: true,
        tags,
        transactionDate,
        transactionItems,
      };

      const record: Omit<OfflineTransactionRecord, "updatedAt"> = {
        amount: payload.amount,
        bankAccountStatus: null,
        bankAccountTransactionType: null,
        bankName: null,
        counterpartyName: null,
        currencyCode: currencyOptions.find((item) => item.value === payload.currencyId)?.label ?? payload.currencyId,
        description: payload.description ?? "",
        direction: payload.direction,
        exchangeId: null,
        id: payload.id,
        isActive: payload.isActive,
        payloadJson: JSON.stringify(payload),
        tags: payload.tags ?? [],
        transactionDate: payload.transactionDate,
        transferId: null,
        transferStatus: null,
        transferType: null,
        type: "CashFlow",
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
      {error != null ? <Alert severity="error">{error}</Alert> : null}
      <TransactionFormTabs
        value={tab}
        onChange={setTab}
        itemsContent={
          <TransactionItemsEditor control={form.control} name="transactionItems" disabled={isSubmitting} currencyCode={selectedCurrencyCode} />
        }
        formContent={
          <Grid container spacing={2}>
            {shown(templateData.amount) ? (
              <Grid size={{ xs: 12 }}>
                <NumberInput
                  control={form.control}
                  name="amount"
                  label={t("transactions.amount")}
                  required={isRequired(templateData.amount)}
                  rules={isRequired(templateData.amount) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
                />
              </Grid>
            ) : null}
            {shown(templateData.currencyId) ? (
              <Grid size={{ xs: 12 }}>
                <DropDown
                  control={form.control}
                  name="currencyId"
                  label={t("transactions.currency")}
                  options={currencyOptions}
                  required={isRequired(templateData.currencyId)}
                  rules={isRequired(templateData.currencyId) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
                />
              </Grid>
            ) : null}
            {shown(templateData.direction) ? (
              <Grid size={{ xs: 12 }}>
                <DropDown
                  control={form.control}
                  name="direction"
                  label={t("transactions.direction")}
                  options={[
                    { label: t("transactions.directionIn"), value: "1" },
                    { label: t("transactions.directionOut"), value: "2" },
                  ]}
                  required={isRequired(templateData.direction)}
                  rules={isRequired(templateData.direction) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
                />
              </Grid>
            ) : null}
            {shown(templateData.transactionDate) ? (
              <Grid size={{ xs: 12 }}>
                <DatePicker
                  control={form.control}
                  name="transactionDate"
                  label={t("transactions.transactionDate")}
                  required={isRequired(templateData.transactionDate)}
                  rules={isRequired(templateData.transactionDate) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
                />
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
          </Grid>
        }
      />
    </Stack>
  );
}
