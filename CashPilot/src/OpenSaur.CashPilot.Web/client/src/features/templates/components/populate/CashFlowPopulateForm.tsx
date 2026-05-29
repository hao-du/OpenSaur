import { Alert, Grid, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../../components/atoms/ActionButton";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number as NumberInput } from "../../../../components/atoms/Number";
import { TextArea } from "../../../../components/atoms/TextArea";
import type { TranslationKey } from "../../../settings/provider/translations";
import { useCreateCashFlowMutation } from "../../../transactions/hooks/useCreateCashFlowMutation";
import type {
  CashFlowFormValues,
  CashFlowTemplateDataShape,
  OptionItem,
} from "./types";
import {
  REQUIRED_FIELD_MESSAGE,
  UNABLE_TO_SAVE_TRANSACTION_MESSAGE,
} from "./constants";
import {
  initialDateValue,
  initialValue,
  isRequired,
  resolve,
  resolveDate,
  resolveOptionalDescription,
  shown,
} from "./utils";

type Props = {
  t: (key: TranslationKey) => string;
  todayIsoDate: string;
  currencyOptions: OptionItem[];
  templateData: CashFlowTemplateDataShape;
  onSaved?: () => Promise<void> | void;
  onClose: () => void;
};

export function CashFlowPopulateForm({
  t,
  todayIsoDate,
  currencyOptions,
  templateData,
  onSaved,
  onClose,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCashFlowMutation = useCreateCashFlowMutation();
  const defaults = useMemo<CashFlowFormValues>(
    () => ({
      amount: initialValue(templateData.amount, todayIsoDate),
      currencyId: initialValue(templateData.currencyId, todayIsoDate),
      direction: initialValue(templateData.direction, todayIsoDate),
      transactionDate: initialDateValue(
        templateData.transactionDate,
        todayIsoDate,
      ),
      description: initialValue(templateData.description, todayIsoDate),
    }),
    [templateData, todayIsoDate],
  );
  const form = useForm<CashFlowFormValues>({ defaultValues: defaults });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const submit = async (v: CashFlowFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createCashFlowMutation.mutateAsync({
        amount: globalThis.Number(
          resolve(templateData.amount, v.amount, todayIsoDate),
        ),
        currencyId: resolve(
          templateData.currencyId,
          v.currencyId,
          todayIsoDate,
        ),
        direction: globalThis.Number(
          resolve(templateData.direction, v.direction, todayIsoDate),
        ),
        transactionDate: resolveDate(
          templateData.transactionDate,
          v.transactionDate,
          todayIsoDate,
        ),
        description: resolveOptionalDescription(
          templateData.description,
          v.description,
          todayIsoDate,
        ),
      });
      await onSaved?.();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : UNABLE_TO_SAVE_TRANSACTION_MESSAGE,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack spacing={2} component="form" onSubmit={form.handleSubmit(submit)}>
      {error != null ? <Alert severity="error">{error}</Alert> : null}
      <Grid container spacing={2}>
        {shown(templateData.amount) ? (
          <Grid size={{ xs: 12 }}>
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
          <Grid size={{ xs: 12 }}>
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
              rules={
                isRequired(templateData.direction)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
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
              rules={
                isRequired(templateData.transactionDate)
                  ? { required: REQUIRED_FIELD_MESSAGE }
                  : undefined
              }
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
      </Grid>
      <Stack direction="row" justifyContent="flex-end">
        <ActionButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("action.working") : t("transactions.create")}
        </ActionButton>
      </Stack>
    </Stack>
  );
}
