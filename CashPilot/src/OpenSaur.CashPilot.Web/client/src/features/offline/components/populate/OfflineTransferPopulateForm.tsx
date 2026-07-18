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
import type { SaveTransferFormRequestDto } from "../../../transactions/dtos/TransactionDto";
import { transactionDirectionValues } from "../../../../infrastructure/constants/transactionEnums";
import type { OfflineTransactionRecord } from "../../storages/offlineTransactionsStore";
import type { OptionItem, TransferFormValues, TransferTemplateDataShape } from "./types";
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
import { REQUIRED_FIELD_MESSAGE, UNABLE_TO_SAVE_TRANSACTION_MESSAGE } from "./constants";

type Props = {
  formId: string;
  t: (key: TranslationKey) => string;
  todayIsoDate: string;
  currencyOptions: OptionItem[];
  counterpartyOptions: OptionItem[];
  templateData: TransferTemplateDataShape;
  onClose: () => void;
  onSave: (record: Omit<OfflineTransactionRecord, "updatedAt">) => Promise<void> | void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
};

export function OfflineTransferPopulateForm({
  formId,
  t,
  todayIsoDate,
  currencyOptions,
  counterpartyOptions,
  templateData,
  onClose,
  onSave,
  onSubmittingChange,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState<"form" | "items">("form");

  const defaults = useMemo<TransferFormValues>(
    () => ({
      counterpartyId: initialValue(templateData.counterpartyId, todayIsoDate) || counterpartyOptions[0]?.value || "",
      transferType: initialValue(templateData.transferType, todayIsoDate),
      status: initialValue(templateData.status, todayIsoDate),
      amount: initialValue(templateData.amount, todayIsoDate),
      currencyId: initialValue(templateData.currencyId, todayIsoDate),
      direction: initialValue(templateData.direction, todayIsoDate),
      transactionDate: initialDateValue(templateData.transactionDate, todayIsoDate),
      dueDate: initialDateValue(templateData.dueDate, todayIsoDate),
      description: initialValue(templateData.description, todayIsoDate),
      tags: initialTagsValue(templateData.tags),
      transactionItems: [],
    }),
    [counterpartyOptions, templateData, todayIsoDate],
  );

  const form = useForm<TransferFormValues>({ defaultValues: defaults });
  const currencyId = useWatch({ control: form.control, name: "currencyId" });
  const selectedCurrencyCode = currencyOptions.find((item) => item.value === currencyId)?.label;

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const submit = async (values: TransferFormValues) => {
    setIsSubmitting(true);
    onSubmittingChange?.(true);
    setError(null);

    try {
      const amount = Number(resolve(templateData.amount, values.amount, todayIsoDate) || "0");
      const currencyIdValue = resolve(templateData.currencyId, values.currencyId, todayIsoDate);
      const direction = Number(resolve(templateData.direction, values.direction, todayIsoDate) || String(transactionDirectionValues.outflow));
      const transactionDate = resolveDate(templateData.transactionDate, values.transactionDate, todayIsoDate);
      const dueDate = resolveDate(templateData.dueDate, values.dueDate, todayIsoDate);
      const description = resolveOptionalDescription(templateData.description, values.description, todayIsoDate);
      const tags = resolveTags(templateData.tags, values.tags);
      const payload: SaveTransferFormRequestDto = {
        amount,
        counterpartyId: resolve(templateData.counterpartyId, values.counterpartyId, todayIsoDate),
        currencyId: currencyIdValue,
        description: description ?? undefined,
        details: [
          {
            amount,
            currencyId: currencyIdValue,
            direction,
            transactionDate,
            isActive: true,
          },
        ],
        dueDate: dueDate.trim().length > 0 ? dueDate : undefined,
        id: crypto.randomUUID(),
        isActive: true,
        status: Number(resolve(templateData.status, values.status, todayIsoDate) || "1"),
        tags,
        transactionDate,
        transactionItems: values.transactionItems
          .filter((item) => item.name.trim().length > 0)
          .map((item) => ({ name: item.name.trim(), amount: Number(item.amount || "0") })),
        transferType: Number(resolve(templateData.transferType, values.transferType, todayIsoDate) || "1"),
      };

      const record: Omit<OfflineTransactionRecord, "updatedAt"> = {
        amount: payload.amount,
        bankAccountStatus: null,
        bankAccountTransactionType: null,
        bankName: null,
        counterpartyName: counterpartyOptions.find((item) => item.value === payload.counterpartyId)?.label ?? null,
        currencyCode: currencyOptions.find((item) => item.value === payload.currencyId)?.label ?? payload.currencyId,
        description: payload.description ?? "",
        direction: payload.details[0]?.direction ?? null,
        exchangeId: null,
        id: payload.id ?? crypto.randomUUID(),
        isActive: payload.isActive,
        payloadJson: JSON.stringify(payload),
        tags: payload.tags ?? [],
        transactionDate: payload.transactionDate,
        transferId: payload.id ?? crypto.randomUUID(),
        transferStatus: payload.status,
        transferType: payload.transferType,
        type: "Transfer",
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
              rules={isRequired(templateData.counterpartyId) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
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
              rules={isRequired(templateData.transferType) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
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
              rules={isRequired(templateData.status) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
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
              rules={isRequired(templateData.amount) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
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
              rules={isRequired(templateData.currencyId) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
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
              rules={isRequired(templateData.direction) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
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
              rules={isRequired(templateData.transactionDate) ? { required: REQUIRED_FIELD_MESSAGE } : undefined}
            />
          </Grid>
        ) : null}
        {shown(templateData.dueDate) ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker control={form.control} name="dueDate" label={t("transactions.dueDate")} />
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
      </Grid>}
      />
    </Stack>
  );
}
