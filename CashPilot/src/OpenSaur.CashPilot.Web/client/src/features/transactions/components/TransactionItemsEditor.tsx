import { Stack } from "@mui/material";
import { type FieldArrayPath, type FieldValues, type Path, type Control, useFieldArray, useWatch } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { Number as NumberInput } from "../../../components/atoms/Number";
import { Text } from "../../../components/atoms/Text";
import { BodyText } from "../../../components/atoms/BodyText";
import { formatAmount } from "../../../infrastructure/constants/numberFormatters";
import { useSettings } from "../../settings/provider/SettingProvider";

type Props<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldArrayPath<TFieldValues>;
  disabled?: boolean;
  currencyCode?: string;
};

export function TransactionItemsEditor<TFieldValues extends FieldValues>({
  control,
  name,
  disabled = false,
  currencyCode
}: Props<TFieldValues>) {
  const { locale, t } = useSettings();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
    keyName: "clientKey"
  });

  const items = useWatch({ control, name: name as Path<TFieldValues> }) as Array<{ amount?: string }> | undefined;

  const totalAmount = (items ?? []).reduce((sum, item) => {
    const amount = Number((item?.amount ?? "").replace(/,/g, ""));
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <BodyText sx={{ fontWeight: 600 }}>
          {`${t("transactions.transactionItems.totalAmount")}: ${formatAmount(totalAmount, locale)}${currencyCode ? ` ${currencyCode}` : ""}`}
        </BodyText>
        <ActionButton
          type="button"
          variant="outlined"
          onClick={() => append({ id: undefined, name: "", amount: "" } as never)}
          disabled={disabled}
        >
          {t("transactions.transactionItems.add")}
        </ActionButton>
      </Stack>

      {fields.map((field, index) => (
        <Stack key={field.clientKey} direction={{ xs: "column", md: "row" }} spacing={2}>
          <Text
            control={control}
            name={`${name}.${index}.name` as Path<TFieldValues>}
            label={t("transactions.transactionItems.name")}
          />
          <NumberInput
            control={control}
            name={`${name}.${index}.amount` as Path<TFieldValues>}
            label={t("transactions.transactionItems.amount")}
          />
          <ActionButton
            type="button"
            color="inherit"
            onClick={() => remove(index)}
            disabled={disabled}
          >
            {t("transactions.transactionItems.remove")}
          </ActionButton>
        </Stack>
      ))}
    </Stack>
  );
}
