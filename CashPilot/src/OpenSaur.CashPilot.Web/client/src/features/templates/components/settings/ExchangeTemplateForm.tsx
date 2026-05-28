import { Stack } from "@mui/material";
import { useWatch, type Control } from "react-hook-form";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number } from "../../../../components/atoms/Number";
import { TextArea } from "../../../../components/atoms/TextArea";
import { useSettings } from "../../../settings/provider/SettingProvider";
import type { CurrencyDto } from "../../../currencies/dtos/CurrencyDto";
import type { TemplateFormValues } from "./TemplateForm";
import { FieldRow } from "./TemplateFormShared";

export function ExchangeTemplateForm({ control, currencies, isSubmitting }: { control: Control<TemplateFormValues>; currencies: CurrencyDto[]; isSubmitting: boolean; }) {
  const { t } = useSettings();
  const templateData = useWatch({ control, name: "templateData" as never }) as {
    exchangeRate?: { autoPopulate?: boolean };
    exchangeDate?: { autoPopulate?: boolean };
    outAmount?: { autoPopulate?: boolean };
    outCurrencyId?: { autoPopulate?: boolean };
    inAmount?: { autoPopulate?: boolean };
    inCurrencyId?: { autoPopulate?: boolean };
    description?: { autoPopulate?: boolean };
  } | undefined;
  const exchangeRateMode = templateData?.exchangeRate?.autoPopulate;
  const exchangeDateMode = templateData?.exchangeDate?.autoPopulate;
  const outAmountMode = templateData?.outAmount?.autoPopulate;
  const outCurrencyMode = templateData?.outCurrencyId?.autoPopulate;
  const inAmountMode = templateData?.inAmount?.autoPopulate;
  const inCurrencyMode = templateData?.inCurrencyId?.autoPopulate;
  const descriptionMode = templateData?.description?.autoPopulate;
  const currencyOptions = currencies.map(x => ({ label: x.shortName, value: x.id }));
  return (
    <Stack spacing={2}>
      <FieldRow control={control} modeName="templateData.exchangeRate.autoPopulate"><Number control={control} disabled={isSubmitting} label={t("transactions.exchangeRate")} name="templateData.exchangeRate.value" required={exchangeRateMode === true} rules={exchangeRateMode === true ? { required: t("transactions.validation.exchangeRateRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.exchangeDate.autoPopulate"><DatePicker control={control} label={t("transactions.exchangeDate")} name="templateData.exchangeDate.value" disabled={isSubmitting || exchangeDateMode === true} required={exchangeDateMode === true} rules={exchangeDateMode === true ? { required: t("transactions.validation.exchangeDateRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.outAmount.autoPopulate"><Number control={control} disabled={isSubmitting} label={t("transactions.outAmount")} name="templateData.outAmount.value" required={outAmountMode === true} rules={outAmountMode === true ? { required: t("transactions.validation.outAmountRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.outCurrencyId.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.outCurrency")} name="templateData.outCurrencyId.value" options={currencyOptions} required={outCurrencyMode === true} rules={outCurrencyMode === true ? { required: t("transactions.validation.outCurrencyRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.inAmount.autoPopulate"><Number control={control} disabled={isSubmitting} label={t("transactions.inAmount")} name="templateData.inAmount.value" required={inAmountMode === true} rules={inAmountMode === true ? { required: t("transactions.validation.inAmountRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.inCurrencyId.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.inCurrency")} name="templateData.inCurrencyId.value" options={currencyOptions} required={inCurrencyMode === true} rules={inCurrencyMode === true ? { required: t("transactions.validation.inCurrencyRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.description.autoPopulate"><TextArea control={control} disabled={isSubmitting} label={t("transactions.description")} minRows={3} name="templateData.description.value" required={descriptionMode === true} rules={descriptionMode === true ? { required: t("templates.validation.descriptionRequired") } : undefined} /></FieldRow>
    </Stack>
  );
}





