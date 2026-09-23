import { Stack, Typography } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { FormSection } from "../../../components/atoms/FormSection";
import { Number as NumberField } from "../../../components/atoms/Number";
import { TextArea } from "../../../components/atoms/TextArea";
import { formatAmount } from "../../../infrastructure/constants/numberFormatters";
import { transactionDirections } from "../../../infrastructure/constants/transactionEnums";
import { useSettings } from "../../settings/provider/SettingProvider";

export type SubTransactionEditorModel = {
  clientKey: string;
  id?: string;
  amount: string;
  transactionDate: string;
  description: string;
  direction?: string;
  transactionType?: string;
  typeLabel?: string;
  isActive?: boolean;
  isNew?: boolean;
  isEditing?: boolean;
};

type FormValues = {
  amount: string;
  transactionDate: string;
  description: string;
  direction: string;
};

type Props<T extends SubTransactionEditorModel> = {
  detail: T;
  errorMessage?: string | null;
  isEditing?: boolean;
  disabled?: boolean;
  showDirection?: boolean;
  typeLabel?: string;
  onAccept: (detail: T) => void;
  onDelete: () => void;
  onCancelNew: () => void;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
};

export function SubTransactionItemForm<T extends SubTransactionEditorModel>({
  detail,
  errorMessage,
  isEditing: isEditingProp,
  disabled = false,
  showDirection = false,
  typeLabel,
  onAccept,
  onDelete,
  onCancelNew,
  onStartEdit,
  onCancelEdit,
}: Props<T>) {
  const { formatDate, locale, t } = useSettings();
  const isEditing = isEditingProp ?? detail.isNew ?? false;

  const form = useForm<FormValues>({
    defaultValues: {
      amount: detail.amount,
      description: detail.description,
      direction: detail.direction ?? String(transactionDirections.inflow),
      transactionDate: detail.transactionDate,
    },
  });

  useEffect(() => {
    form.reset({
      amount: detail.amount,
      description: detail.description,
      direction: detail.direction ?? String(transactionDirections.inflow),
      transactionDate: detail.transactionDate,
    });
  }, [detail, form]);

  const handleStartEdit = () => {
    form.reset({
      amount: detail.amount,
      description: detail.description,
      direction: detail.direction ?? String(transactionDirections.inflow),
      transactionDate: detail.transactionDate,
    });
    onStartEdit?.();
  };

  const handleCancel = () => {
    if (detail.isNew) {
      onCancelNew();
      return;
    }
    form.reset({
      amount: detail.amount,
      description: detail.description,
      direction: detail.direction ?? String(transactionDirections.inflow),
      transactionDate: detail.transactionDate,
    });
    onCancelEdit?.();
  };

  const formattedAmount = Number.isFinite(Number(detail.amount))
    ? formatAmount(Number(detail.amount), locale)
    : detail.amount;

  const directionText =
    detail.direction === String(transactionDirections.inflow) || detail.direction === "1"
      ? t("transactions.directionIn")
      : t("transactions.directionOut");

  if (!isEditing) {
    return (
      <FormSection>
        <span>
          <strong>{t("transactions.date")}:</strong> {formatDate(detail.transactionDate)}
        </span>
        <span>
          <strong>{t("transactions.amount")}:</strong> {formattedAmount}
        </span>
        {showDirection && (
          <span>
            <strong>{t("transactions.direction")}:</strong> {directionText}
          </span>
        )}
        {typeLabel && (
          <span>
            <strong>{t("transactions.type")}:</strong> {typeLabel}
          </span>
        )}
        {detail.description.trim().length > 0 ? (
          <span>
            <strong>{t("transactions.description")}:</strong> {detail.description}
          </span>
        ) : null}
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <ActionButton size="small" variant="outlined" onClick={handleStartEdit} disabled={disabled}>
            {t("transactions.edit")}
          </ActionButton>
          <ActionButton size="small" variant="outlined" color="error" onClick={onDelete} disabled={disabled}>
            {t("transactions.delete")}
          </ActionButton>
        </Stack>
      </FormSection>
    );
  }

  return (
    <FormSection
      sx={
        errorMessage
          ? {
              borderColor: "error.main",
              borderWidth: 1.5,
              borderStyle: "solid",
            }
          : undefined
      }
    >
      {showDirection ? (
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Stack sx={{ flex: 2 }}>
            <NumberField
              control={form.control}
              disabled={disabled}
              label={t("transactions.amount")}
              name="amount"
              required
              rules={{ required: t("transactions.validation.amountRequired") }}
            />
          </Stack>
          <Stack sx={{ flex: 1 }}>
            <DropDown
              control={form.control}
              disabled={disabled}
              label={t("transactions.direction")}
              name="direction"
              options={[
                { label: t("transactions.directionIn"), value: transactionDirections.inflow },
                { label: t("transactions.directionOut"), value: transactionDirections.outflow },
              ]}
              required
              rules={{ required: t("transactions.validation.directionRequired") }}
            />
          </Stack>
        </Stack>
      ) : (
        <NumberField
          control={form.control}
          disabled={disabled}
          label={t("transactions.amount")}
          name="amount"
          required
          rules={{ required: t("transactions.validation.amountRequired") }}
        />
      )}
      <DatePicker
        control={form.control}
        disabled={disabled}
        label={t("transactions.date")}
        name="transactionDate"
        required
        rules={{ required: t("transactions.validation.dateRequired") }}
      />
      <TextArea
        control={form.control}
        disabled={disabled}
        label={t("transactions.description")}
        name="description"
        minRows={3}
      />
      {errorMessage && (
        <Typography variant="caption" color="error" sx={{ display: "block", fontSize: "0.75rem", mt: 0.5 }}>
          {errorMessage}
        </Typography>
      )}
      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        <ActionButton variant="outlined" onClick={handleCancel} disabled={disabled}>
          {t("action.cancel")}
        </ActionButton>
        <ActionButton
          variant="contained"
          disabled={disabled}
          onClick={() => {
            void form.handleSubmit((values) => {
              onAccept({
                ...detail,
                amount: values.amount,
                description: values.description,
                direction: showDirection ? values.direction : detail.direction,
                transactionDate: values.transactionDate,
                isNew: false,
              });
            })();
          }}
        >
          {t("action.confirm")}
        </ActionButton>
      </Stack>
    </FormSection>
  );
}

