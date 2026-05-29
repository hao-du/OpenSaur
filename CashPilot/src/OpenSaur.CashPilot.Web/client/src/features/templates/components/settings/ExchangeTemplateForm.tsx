import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number } from "../../../../components/atoms/Number";
import { TextArea } from "../../../../components/atoms/TextArea";
import { useSettings } from "../../../settings/provider/SettingProvider";
import type { TemplateFormValues } from "./TemplateForm";
import { FieldRow } from "./TemplateFormShared";
import type { ExchangeTemplateFormProps } from "./types";
import {
  clearErrorsWhenNotRequired,
  requiredWhenAutoHidden,
  toOptions,
} from "./utils";

export function ExchangeTemplateForm({
  control,
  currencies,
  isSubmitting,
}: ExchangeTemplateFormProps) {
  const { t } = useSettings();
  const { clearErrors, getValues } = useFormContext<TemplateFormValues>();
  const exchangeRateMode = useWatch({
    control,
    name: "templateData.exchangeRate.autoPopulate",
  });
  const exchangeRateShowUi = useWatch({
    control,
    name: "templateData.exchangeRate.showUi",
  });
  const exchangeDateMode = useWatch({
    control,
    name: "templateData.exchangeDate.autoPopulate",
  });
  const exchangeDateShowUi = useWatch({
    control,
    name: "templateData.exchangeDate.showUi",
  });
  const outAmountMode = useWatch({
    control,
    name: "templateData.outAmount.autoPopulate",
  });
  const outAmountShowUi = useWatch({
    control,
    name: "templateData.outAmount.showUi",
  });
  const outCurrencyMode = useWatch({
    control,
    name: "templateData.outCurrencyId.autoPopulate",
  });
  const outCurrencyShowUi = useWatch({
    control,
    name: "templateData.outCurrencyId.showUi",
  });
  const inAmountMode = useWatch({
    control,
    name: "templateData.inAmount.autoPopulate",
  });
  const inAmountShowUi = useWatch({
    control,
    name: "templateData.inAmount.showUi",
  });
  const inCurrencyMode = useWatch({
    control,
    name: "templateData.inCurrencyId.autoPopulate",
  });
  const inCurrencyShowUi = useWatch({
    control,
    name: "templateData.inCurrencyId.showUi",
  });
  const descriptionMode = useWatch({
    control,
    name: "templateData.description.autoPopulate",
  });
  const descriptionShowUi = useWatch({
    control,
    name: "templateData.description.showUi",
  });
  const exchangeRateRequired =
    exchangeRateMode === true && exchangeRateShowUi !== true;
  const exchangeDateRequired =
    exchangeDateMode === true && exchangeDateShowUi !== true;
  const outAmountRequired = outAmountMode === true && outAmountShowUi !== true;
  const outCurrencyRequired =
    outCurrencyMode === true && outCurrencyShowUi !== true;
  const inAmountRequired = inAmountMode === true && inAmountShowUi !== true;
  const inCurrencyRequired =
    inCurrencyMode === true && inCurrencyShowUi !== true;
  const descriptionRequired =
    descriptionMode === true && descriptionShowUi !== true;
  const currencyOptions = toOptions(
    currencies,
    (x) => x.shortName,
    (x) => x.id,
  );
  type ExchangeFieldKey =
    | "exchangeRate"
    | "exchangeDate"
    | "outAmount"
    | "outCurrencyId"
    | "inAmount"
    | "inCurrencyId"
    | "description";
  const requiredWhenHidden = (valuePath: ExchangeFieldKey, message: string) =>
    requiredWhenAutoHidden(getValues, valuePath, message);
  useEffect(() => {
    clearErrorsWhenNotRequired(clearErrors, [
      {
        path: "templateData.exchangeRate.value",
        required: exchangeRateRequired,
      },
      {
        path: "templateData.exchangeDate.value",
        required: exchangeDateRequired,
      },
      { path: "templateData.outAmount.value", required: outAmountRequired },
      {
        path: "templateData.outCurrencyId.value",
        required: outCurrencyRequired,
      },
      { path: "templateData.inAmount.value", required: inAmountRequired },
      { path: "templateData.inCurrencyId.value", required: inCurrencyRequired },
      { path: "templateData.description.value", required: descriptionRequired },
    ]);
  }, [
    clearErrors,
    descriptionRequired,
    exchangeDateRequired,
    exchangeRateRequired,
    inAmountRequired,
    inCurrencyRequired,
    outAmountRequired,
    outCurrencyRequired,
  ]);
  return (
    <Stack spacing={2}>
      <FieldRow
        control={control}
        modeName="templateData.exchangeRate.autoPopulate"
      >
        <Number
          control={control}
          disabled={isSubmitting}
          label={t("transactions.exchangeRate")}
          name="templateData.exchangeRate.value"
          required={exchangeRateRequired}
          rules={{
            validate: requiredWhenHidden(
              "exchangeRate",
              t("transactions.validation.exchangeRateRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow
        control={control}
        modeName="templateData.exchangeDate.autoPopulate"
      >
        <DatePicker
          control={control}
          label={t("transactions.exchangeDate")}
          name="templateData.exchangeDate.value"
          disabled={isSubmitting || exchangeDateMode === true}
          required={exchangeDateRequired}
          rules={{
            validate: requiredWhenHidden(
              "exchangeDate",
              t("transactions.validation.exchangeDateRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow
        control={control}
        modeName="templateData.outAmount.autoPopulate"
      >
        <Number
          control={control}
          disabled={isSubmitting}
          label={t("transactions.outAmount")}
          name="templateData.outAmount.value"
          required={outAmountRequired}
          rules={{
            validate: requiredWhenHidden(
              "outAmount",
              t("transactions.validation.outAmountRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow
        control={control}
        modeName="templateData.outCurrencyId.autoPopulate"
      >
        <DropDown
          control={control}
          disabled={isSubmitting}
          label={t("transactions.outCurrency")}
          name="templateData.outCurrencyId.value"
          options={currencyOptions}
          required={outCurrencyRequired}
          rules={{
            validate: requiredWhenHidden(
              "outCurrencyId",
              t("transactions.validation.outCurrencyRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow control={control} modeName="templateData.inAmount.autoPopulate">
        <Number
          control={control}
          disabled={isSubmitting}
          label={t("transactions.inAmount")}
          name="templateData.inAmount.value"
          required={inAmountRequired}
          rules={{
            validate: requiredWhenHidden(
              "inAmount",
              t("transactions.validation.inAmountRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow
        control={control}
        modeName="templateData.inCurrencyId.autoPopulate"
      >
        <DropDown
          control={control}
          disabled={isSubmitting}
          label={t("transactions.inCurrency")}
          name="templateData.inCurrencyId.value"
          options={currencyOptions}
          required={inCurrencyRequired}
          rules={{
            validate: requiredWhenHidden(
              "inCurrencyId",
              t("transactions.validation.inCurrencyRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow
        control={control}
        modeName="templateData.description.autoPopulate"
      >
        <TextArea
          control={control}
          disabled={isSubmitting}
          label={t("transactions.description")}
          minRows={3}
          name="templateData.description.value"
          required={descriptionRequired}
          rules={{
            validate: requiredWhenHidden(
              "description",
              t("templates.validation.descriptionRequired"),
            ),
          }}
        />
      </FieldRow>
    </Stack>
  );
}
