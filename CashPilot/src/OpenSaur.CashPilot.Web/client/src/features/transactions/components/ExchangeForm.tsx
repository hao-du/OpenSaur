import { Grid, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number as NumberField } from "../../../components/atoms/Number";
import { TextArea } from "../../../components/atoms/TextArea";
import { TagAutocompleteMultiSelect } from "../../tags/components/TagAutocompleteMultiSelect";
import { useSettings } from "../../settings/provider/SettingProvider";
import { transactionFormTabs } from "../../../infrastructure/constants/transactionEnums";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import { TransactionItemsEditor } from "./TransactionItemsEditor";
import { TransactionFormTabs } from "./TransactionFormTabs";

type Props = {
  currencies: CurrencyDto[];
  formId: string;
  initialValue?: {
    exchangeRate: number | null;
    exchangeDate: string;
    outCurrencyId: string;
    outAmount: number;
    inCurrencyId: string;
    inAmount: number;
    description?: string | null;
    tags?: string[] | null;
    transactionItems?: Array<{ id?: string; name: string; amount: number }>;
  } | null;
  isSubmitting?: boolean;
  isAutoTagging?: boolean;
  tagOptions?: string[];
  onAutoTag?: (description: string, existingTags: string[], transactionType: "Exchange") => Promise<string[]>;
  onAutoTagActionChange?: (handler: (() => Promise<void>) | null) => void;
  onSubmit: (payload: {
    exchangeRate?: number;
    exchangeDate: string;
    outLeg: { currencyId: string; amount: number; description?: string };
    inLeg: { currencyId: string; amount: number; description?: string };
    description?: string;
    tags: string[];
    transactionItems: Array<{ id?: string; name: string; amount: number }>;
  }) => Promise<void>;
};

type FormValues = {
  exchangeRate: string;
  exchangeDate: string;
  outCurrencyId: string;
  outAmount: string;
  inCurrencyId: string;
  inAmount: string;
  description: string;
  tags: string[];
  transactionItems: Array<{ id?: string; name: string; amount: string }>;
};

function getInitialValues(
  currencies: CurrencyDto[],
  today: string,
  initialValue?: Props["initialValue"],
): FormValues {
  if (initialValue == null) {
    return {
      description: "",
      exchangeDate: today,
      exchangeRate: "",
      inAmount: "",
      inCurrencyId: currencies[0]?.id ?? "",
      outAmount: "",
      outCurrencyId: currencies[0]?.id ?? "",
      tags: [],
      transactionItems: [],
    };
  }

  return {
    description: initialValue.description ?? "",
    exchangeDate: initialValue.exchangeDate,
    exchangeRate: initialValue.exchangeRate == null ? "" : initialValue.exchangeRate.toString(),
    inAmount: initialValue.inAmount.toString(),
    inCurrencyId: initialValue.inCurrencyId,
    outAmount: initialValue.outAmount.toString(),
    outCurrencyId: initialValue.outCurrencyId,
    tags: initialValue.tags ?? [],
    transactionItems: (initialValue.transactionItems ?? []).map((x) => ({
      id: x.id,
      name: x.name,
      amount: x.amount.toString(),
    })),
  };
}

export function ExchangeForm({
  currencies,
  formId,
  initialValue,
  isSubmitting = false,
  isAutoTagging = false,
  tagOptions,
  onAutoTag,
  onAutoTagActionChange,
  onSubmit
}: Props) {
  const { t, todayIsoDate } = useSettings();
  const today = todayIsoDate;
  const isBusy = isSubmitting || isAutoTagging;

  const [tab, setTab] = useState<(typeof transactionFormTabs)[keyof typeof transactionFormTabs]>(transactionFormTabs.form);

  const form = useForm<FormValues>({
    defaultValues: getInitialValues(currencies, today, initialValue)
  });

  useEffect(() => {
    form.reset(getInitialValues(currencies, today, initialValue));
  }, [currencies, form, initialValue, today]);

  const currencyOptions = currencies.map(x => ({ label: x.shortName, value: x.id }));
  const outCurrencyId = useWatch({ control: form.control, name: "outCurrencyId" });
  const selectedCurrencyCode = currencies.find(x => x.id === outCurrencyId)?.shortName;
  const handleAutoTag = async () => {
    if (onAutoTag == null) {
      return;
    }

    const values = form.getValues();
    const tags = await onAutoTag(values.description, values.tags, "Exchange");
    form.setValue("tags", tags, { shouldDirty: true, shouldTouch: true });
  };

  useEffect(() => {
    onAutoTagActionChange?.(onAutoTag == null ? null : handleAutoTag);
    return () => {
      onAutoTagActionChange?.(null);
    };
  }, [handleAutoTag, onAutoTag, onAutoTagActionChange]);

  return (
    <Stack spacing={2}>
      <TransactionFormTabs
        value={tab}
        onChange={setTab}
        itemsContent={
          <TransactionItemsEditor
            control={form.control}
            name="transactionItems"
            disabled={isBusy}
            currencyCode={selectedCurrencyCode}
          />
        }
        formContent={
          <Grid
            container
            spacing={2}
            component="form"
            id={formId}
            noValidate
            onSubmit={form.handleSubmit(async values => {
              await onSubmit({
                description: values.description.trim().length === 0 ? undefined : values.description.trim(),
                exchangeDate: values.exchangeDate,
                exchangeRate: values.exchangeRate.trim().length === 0 ? undefined : Number(values.exchangeRate),
                inLeg: {
                  amount: Number(values.inAmount),
                  currencyId: values.inCurrencyId
                },
                outLeg: {
                  amount: Number(values.outAmount),
                  currencyId: values.outCurrencyId
                },
                tags: values.tags,
                transactionItems: values.transactionItems
                  .filter(x => x.name.trim().length > 0)
                  .map(x => ({
                    id: x.id,
                    name: x.name.trim(),
                    amount: Number(x.amount || "0")
                  }))
              });
            })}
          >
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                control={form.control}
                label={t("transactions.exchangeDate")}
                name="exchangeDate"
                required
                rules={{ required: t("transactions.validation.exchangeDateRequired") }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <NumberField
                control={form.control}
                label={t("transactions.exchangeRate")}
                name="exchangeRate"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextArea
                control={form.control}
                label={t("transactions.description")}
                name="description"
                minRows={3}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
            <TagAutocompleteMultiSelect
              control={form.control}
              label={t("tags.title")}
              name="tags"
              tagOptions={tagOptions}
            />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <h3 style={{ margin: 0 }}>{t("transactions.exchangeLegs")}</h3>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <NumberField
                control={form.control}
                label={t("transactions.outAmount")}
                name="outAmount"
                required
                rules={{ required: t("transactions.validation.outAmountRequired") }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <DropDown
                control={form.control}
                label={t("transactions.outCurrency")}
                name="outCurrencyId"
                options={currencyOptions}
                required
                rules={{ required: t("transactions.validation.outCurrencyRequired") }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <NumberField
                control={form.control}
                label={t("transactions.inAmount")}
                name="inAmount"
                required
                rules={{ required: t("transactions.validation.inAmountRequired") }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <DropDown
                control={form.control}
                label={t("transactions.inCurrency")}
                name="inCurrencyId"
                options={currencyOptions}
                required
                rules={{ required: t("transactions.validation.inCurrencyRequired") }}
              />
            </Grid>
          </Grid>
        }
      />
    </Stack>
  );
}
