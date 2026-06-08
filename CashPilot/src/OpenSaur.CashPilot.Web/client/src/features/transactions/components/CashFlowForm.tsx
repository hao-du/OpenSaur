import { Stack } from "@mui/material";
import { WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number as NumberInput } from "../../../components/atoms/Number";
import { TextArea } from "../../../components/atoms/TextArea";
import { TagAutocompleteMultiSelect } from "../../tags/components/TagAutocompleteMultiSelect";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { transactionDirections, transactionFormTabs } from "../../../infrastructure/constants/transactionEnums";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { CashFlowDetailDto } from "../dtos/TransactionDto";
import { TransactionItemsEditor } from "./TransactionItemsEditor";
import { TransactionFormTabs } from "./TransactionFormTabs";

export type CashFlowFormValues = {
  amount: string;
  currencyId: string;
  description: string;
  direction: string;
  transactionDate: string;
  tags: string[];
  transactionItems: Array<{ id?: string; name: string; amount: string }>;
};

type Props = {
  currencies: CurrencyDto[];
  initialValue?: CashFlowDetailDto | null;
  isSubmitting?: boolean;
  isAutoTagging?: boolean;
  onAutoTag?: (description: string, existingTags: string[], transactionType: "CashFlow") => Promise<string[]>;
  onSubmit: (payload: {
    amount: number;
    currencyId: string;
    direction: number;
    transactionDate: string;
    description?: string;
    tags: string[];
    transactionItems: Array<{ id?: string; name: string; amount: number }>;
  }) => Promise<void>;
};

function getInitialValues(
  currencies: CurrencyDto[],
  today: string,
  initialValue?: CashFlowDetailDto | null,
): CashFlowFormValues {
  if (initialValue == null) {
    return {
      amount: "",
      currencyId: currencies[0]?.id ?? "",
      description: "",
      direction: transactionDirections.outflow,
      transactionDate: today,
      tags: [],
      transactionItems: [],
    };
  }

  return {
    amount: initialValue.amount.toString(),
    currencyId: initialValue.currencyId,
    description: initialValue.description ?? "",
    direction: initialValue.direction.toString(),
    transactionDate: initialValue.transactionDate,
    tags: initialValue.tags ?? [],
    transactionItems: (initialValue.transactionItems ?? []).map((x) => ({
      id: x.id,
      name: x.name,
      amount: x.amount.toString(),
    })),
  };
}

export function CashFlowForm({
  currencies,
  initialValue,
  isSubmitting = false,
  isAutoTagging = false,
  onAutoTag,
  onSubmit,
}: Props) {
  const { t, todayIsoDate } = useSettings();
  const today = todayIsoDate;
  const [tab, setTab] = useState<(typeof transactionFormTabs)[keyof typeof transactionFormTabs]>(transactionFormTabs.form);
  const form = useForm<CashFlowFormValues>({
    defaultValues: getInitialValues(currencies, today, initialValue),
  });

  useEffect(() => {
    form.reset(getInitialValues(currencies, today, initialValue));
  }, [currencies, form, initialValue, today]);

  const currencyOptions = useMemo(
    () => currencies.map((currency) => ({ label: currency.shortName, value: currency.id })),
    [currencies],
  );
  const selectedCurrencyId = useWatch({ control: form.control, name: "currencyId" });
  const selectedCurrencyCode = currencies.find((x) => x.id === selectedCurrencyId)?.shortName;
  const handleAutoTag = async () => {
    if (onAutoTag == null) {
      return;
    }

    const values = form.getValues();
    const tags = await onAutoTag(values.description, values.tags, "CashFlow");
    form.setValue("tags", tags, { shouldDirty: true, shouldTouch: true });
  };

  return (
    <Stack
      spacing={2}
      component="form"
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          amount: Number(values.amount),
          currencyId: values.currencyId,
          description: values.description.trim().length === 0 ? undefined : values.description.trim(),
          direction: Number(values.direction),
          transactionDate: values.transactionDate,
          tags: values.tags,
          transactionItems: values.transactionItems
            .filter((x) => x.name.trim().length > 0)
            .map((x) => ({
              id: x.id,
              name: x.name.trim(),
              amount: Number(x.amount || "0"),
            })),
        });
      })}
    >
      <TransactionFormTabs
        value={tab}
        onChange={setTab}
        itemsContent={
          <TransactionItemsEditor
            control={form.control}
            name="transactionItems"
            disabled={isSubmitting}
            currencyCode={selectedCurrencyCode}
          />
        }
        formContent={
          <Stack spacing={2}>
            <Stack sx={layoutStyles.drawerBody} spacing={2}>
              <NumberInput
                control={form.control}
                disabled={isSubmitting}
                label={t("transactions.amount")}
                name="amount"
                required
                rules={{
                  required: t("transactions.validation.amountRequired"),
                }}
              />
              <DropDown
                control={form.control}
                disabled={isSubmitting}
                label={t("transactions.currency")}
                name="currencyId"
                options={currencyOptions}
                required
                rules={{
                  required: t("transactions.validation.currencyRequired"),
                }}
              />
              <DropDown
                control={form.control}
                disabled={isSubmitting}
                label={t("transactions.direction")}
                name="direction"
                options={[
                  { label: t("transactions.directionIn"), value: transactionDirections.inflow },
                  { label: t("transactions.directionOut"), value: transactionDirections.outflow },
                ]}
                required
                rules={{
                  required: t("transactions.validation.directionRequired"),
                }}
              />
              <DatePicker
                control={form.control}
                disabled={isSubmitting}
                label={t("transactions.date")}
                name="transactionDate"
                required
                rules={{
                  required: t("transactions.validation.dateRequired"),
                }}
              />
              <TextArea
                control={form.control}
                disabled={isSubmitting}
                label={t("transactions.description")}
                minRows={3}
                name="description"
              />
              <TagAutocompleteMultiSelect
                control={form.control}
                disabled={isSubmitting}
                label={t("tags.title")}
                name="tags"
              />
            </Stack>
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={layoutStyles.formFooterRow}>
              <ActionButton
                disabled={isSubmitting || isAutoTagging || onAutoTag == null}
                onClick={() => {
                  void handleAutoTag();
                }}
                startIcon={<WandSparkles size={16} />}
                variant="outlined"
              >
                {isAutoTagging ? t("action.working") : t("transactions.autoTag")}
              </ActionButton>
              <ActionButton disabled={isSubmitting} type="submit">
                {isSubmitting ? t("action.working") : initialValue == null ? t("transactions.create") : t("transactions.save")}
              </ActionButton>
            </Stack>
          </Stack>
        }
      />
    </Stack>
  );
}
