import { Stack, TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Controller, type Control } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { DropDown } from "../../../components/atoms/DropDown";
import { TextArea } from "../../../components/atoms/TextArea";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";

export type CashFlowFormValues = {
  amount: string;
  currencyId: string;
  description: string;
  isIncome: boolean;
  transactedOn: string;
};

type CurrencyOption = {
  label: string;
  value: string;
};

type TransactionFormProps = {
  control: Control<CashFlowFormValues>;
  currencyOptions: CurrencyOption[];
  isEditMode: boolean;
  isSubmitting: boolean;
};

function normalizeAmountInput(value: string) {
  return value.replace(/,/g, "").trim();
}

function tryParseAmount(value: string) {
  const normalizedValue = normalizeAmountInput(value);
  if (normalizedValue.length === 0) {
    return null;
  }

  const parsedAmount = Number(normalizedValue);
  return Number.isFinite(parsedAmount) ? parsedAmount : null;
}

function formatAmountDisplay(value: string) {
  const parsedAmount = tryParseAmount(value);
  if (parsedAmount == null) {
    return value;
  }

  return parsedAmount.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
}

export function TransactionForm({
  control,
  currencyOptions,
  isEditMode,
  isSubmitting
}: TransactionFormProps) {
  const { t } = useSettings();

  return (
    <Stack spacing={2} sx={layoutStyles.drawerBody}>
      <Controller
        control={control}
        name="amount"
        render={({ field, fieldState }) => (
          <TextField
            disabled={isSubmitting}
            error={fieldState.error != null}
            fullWidth
            helperText={fieldState.error?.message}
            inputMode="decimal"
            label={t("transactions.amount")}
            onBlur={() => {
              field.onBlur();
              field.onChange(formatAmountDisplay(field.value));
            }}
            onChange={event => {
              field.onChange(event.target.value);
            }}
            required
            value={field.value}
          />
        )}
        rules={{
          required: t("transactions.validation.amountRequired"),
          validate: value => {
            if (typeof value !== "string" || value.trim().length === 0) {
              return t("transactions.validation.amountRequired");
            }

            const numericValue = tryParseAmount(value);
            return numericValue != null && numericValue > 0
              ? true
              : t("transactions.validation.amountInvalid");
          }
        }}
      />
      <DropDown
        control={control}
        disabled={isSubmitting}
        label={t("transactions.currency")}
        name="currencyId"
        options={currencyOptions}
        required
        rules={{
          required: t("transactions.validation.currencyRequired")
        }}
      />
      <Controller
        control={control}
        name="transactedOn"
        render={({ field, fieldState }) => (
          <DateTimePicker
            disabled={isSubmitting}
            label={t("transactions.transactedOn")}
            onChange={value => {
              field.onChange(value == null ? "" : value.format("YYYY-MM-DDTHH:mm"));
            }}
            slotProps={{
              desktopPaper: {
                sx: {
                  border: "1px solid",
                  borderColor: "divider"
                }
              },
              mobilePaper: {
                sx: {
                  border: "1px solid",
                  borderColor: "divider"
                }
              },
              textField: {
                error: fieldState.error != null,
                fullWidth: true,
                helperText: fieldState.error?.message,
                required: true
              }
            }}
            value={field.value.trim().length === 0 ? null : dayjs(field.value)}
          />
        )}
        rules={{
          required: t("transactions.validation.transactedOnRequired")
        }}
      />
      <CheckBox
        control={control}
        disabled={isSubmitting}
        label={t("transactions.isIncome")}
        name="isIncome"
      />
      <TextArea
        control={control}
        disabled={isSubmitting}
        label={t("transactions.description")}
        minRows={3}
        name="description"
      />
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={layoutStyles.formFooterRow}>
        <ActionButton disabled={isSubmitting} type="submit">
          {isSubmitting ? t("action.working") : isEditMode ? t("transactions.save") : t("transactions.create")}
        </ActionButton>
      </Stack>
    </Stack>
  );
}
