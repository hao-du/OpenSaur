import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useFormContext, useWatch, type Control } from "react-hook-form";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number } from "../../../../components/atoms/Number";
import { Text } from "../../../../components/atoms/Text";
import { TextArea } from "../../../../components/atoms/TextArea";
import { useSettings } from "../../../settings/provider/SettingProvider";
import type { BankDto } from "../../../banks/dtos/BankDto";
import type { CurrencyDto } from "../../../currencies/dtos/CurrencyDto";
import type { TemplateFormValues } from "./TemplateForm";
import { FieldRow } from "./TemplateFormShared";

export function BankAccountTemplateForm({ banks, control, currencies, isSubmitting }: { banks: BankDto[]; control: Control<TemplateFormValues>; currencies: CurrencyDto[]; isSubmitting: boolean; }) {
  const { t } = useSettings();
  const { clearErrors, getValues } = useFormContext<TemplateFormValues>();
  const bankMode = useWatch({ control, name: "templateData.bankId.autoPopulate" });
  const bankShowUi = useWatch({ control, name: "templateData.bankId.showUi" });
  const accountNumberMode = useWatch({ control, name: "templateData.accountNumber.autoPopulate" });
  const accountNumberShowUi = useWatch({ control, name: "templateData.accountNumber.showUi" });
  const statusMode = useWatch({ control, name: "templateData.status.autoPopulate" });
  const statusShowUi = useWatch({ control, name: "templateData.status.showUi" });
  const amountMode = useWatch({ control, name: "templateData.amount.autoPopulate" });
  const amountShowUi = useWatch({ control, name: "templateData.amount.showUi" });
  const currencyMode = useWatch({ control, name: "templateData.currencyId.autoPopulate" });
  const currencyShowUi = useWatch({ control, name: "templateData.currencyId.showUi" });
  const interestRateMode = useWatch({ control, name: "templateData.interestRate.autoPopulate" });
  const interestRateShowUi = useWatch({ control, name: "templateData.interestRate.showUi" });
  const startDateMode = useWatch({ control, name: "templateData.startDate.autoPopulate" });
  const startDateShowUi = useWatch({ control, name: "templateData.startDate.showUi" });
  const maturityDateMode = useWatch({ control, name: "templateData.maturityDate.autoPopulate" });
  const maturityDateShowUi = useWatch({ control, name: "templateData.maturityDate.showUi" });
  const descriptionMode = useWatch({ control, name: "templateData.description.autoPopulate" });
  const descriptionShowUi = useWatch({ control, name: "templateData.description.showUi" });
  const bankRequired = bankMode === true && bankShowUi !== true;
  const accountNumberRequired = accountNumberMode === true && accountNumberShowUi !== true;
  const statusRequired = statusMode === true && statusShowUi !== true;
  const amountRequired = amountMode === true && amountShowUi !== true;
  const currencyRequired = currencyMode === true && currencyShowUi !== true;
  const interestRateRequired = interestRateMode === true && interestRateShowUi !== true;
  const startDateRequired = startDateMode === true && startDateShowUi !== true;
  const maturityDateRequired = maturityDateMode === true && maturityDateShowUi !== true;
  const descriptionRequired = descriptionMode === true && descriptionShowUi !== true;

  const bankStatusOptions = [{ label: t("transactions.statusType.active"), value: "1" }, { label: t("transactions.statusType.matured"), value: "2" }, { label: t("transactions.statusType.closedEarly"), value: "3" }];
  const currencyOptions = currencies.map(x => ({ label: x.shortName, value: x.id }));
  const bankOptions = banks.map(x => ({ label: x.shortName, value: x.id }));
  type BankFieldKey = "bankId" | "accountNumber" | "status" | "amount" | "currencyId" | "interestRate" | "startDate" | "maturityDate" | "description";
  const requiredWhenHidden = (valuePath: BankFieldKey, message: string) => (value: unknown) => {
    const autoPopulate = getValues(`templateData.${valuePath}.autoPopulate` as any) as boolean | undefined;
    const showUi = getValues(`templateData.${valuePath}.showUi` as any) as boolean | undefined;
    if (autoPopulate === true && showUi !== true) {
      if (value == null) return message;
      if (typeof value === "string" && value.trim().length === 0) return message;
    }
    return true;
  };
  useEffect(() => {
    if (!bankRequired) clearErrors("templateData.bankId.value");
    if (!accountNumberRequired) clearErrors("templateData.accountNumber.value");
    if (!statusRequired) clearErrors("templateData.status.value");
    if (!amountRequired) clearErrors("templateData.amount.value");
    if (!currencyRequired) clearErrors("templateData.currencyId.value");
    if (!interestRateRequired) clearErrors("templateData.interestRate.value");
    if (!startDateRequired) clearErrors("templateData.startDate.value");
    if (!maturityDateRequired) clearErrors("templateData.maturityDate.value");
    if (!descriptionRequired) clearErrors("templateData.description.value");
  }, [accountNumberRequired, amountRequired, bankRequired, clearErrors, currencyRequired, descriptionRequired, interestRateRequired, maturityDateRequired, startDateRequired, statusRequired]);

  return (
    <Stack spacing={2}>
      <FieldRow control={control} modeName="templateData.bankId.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.bank")} name="templateData.bankId.value" options={bankOptions} required={bankRequired} rules={{ validate: requiredWhenHidden("bankId", t("transactions.validation.bankRequired")) }} /></FieldRow>
      <FieldRow control={control} modeName="templateData.accountNumber.autoPopulate"><Text control={control} disabled={isSubmitting} label={t("transactions.accountNumber")} name="templateData.accountNumber.value" required={accountNumberRequired} rules={{ validate: requiredWhenHidden("accountNumber", t("transactions.validation.accountNumberRequired")) }} /></FieldRow>
      <FieldRow control={control} modeName="templateData.status.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.status")} name="templateData.status.value" options={bankStatusOptions} required={statusRequired} rules={{ validate: requiredWhenHidden("status", t("transactions.validation.statusRequired")) }} /></FieldRow>
      <FieldRow control={control} modeName="templateData.amount.autoPopulate"><Number control={control} disabled={isSubmitting} label={t("transactions.amount")} name="templateData.amount.value" required={amountRequired} rules={{ validate: requiredWhenHidden("amount", t("transactions.validation.amountRequired")) }} /></FieldRow>
      <FieldRow control={control} modeName="templateData.currencyId.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.currency")} name="templateData.currencyId.value" options={currencyOptions} required={currencyRequired} rules={{ validate: requiredWhenHidden("currencyId", t("transactions.validation.currencyRequired")) }} /></FieldRow>
      <FieldRow control={control} modeName="templateData.interestRate.autoPopulate"><Number control={control} disabled={isSubmitting} label={t("transactions.interestRate")} name="templateData.interestRate.value" required={interestRateRequired} rules={{ validate: requiredWhenHidden("interestRate", t("transactions.validation.interestRateRequired")) }} /></FieldRow>
      <FieldRow control={control} modeName="templateData.startDate.autoPopulate"><DatePicker control={control} label={t("transactions.startDate")} name="templateData.startDate.value" disabled={isSubmitting || startDateMode === true} required={startDateRequired} rules={{ validate: requiredWhenHidden("startDate", t("transactions.validation.startDateRequired")) }} /></FieldRow>
      <FieldRow control={control} modeName="templateData.maturityDate.autoPopulate"><DatePicker control={control} label={t("transactions.maturityDate")} name="templateData.maturityDate.value" disabled={isSubmitting || maturityDateMode === true} required={maturityDateRequired} rules={{ validate: requiredWhenHidden("maturityDate", t("transactions.validation.maturityDateRequired")) }} /></FieldRow>
      <FieldRow control={control} modeName="templateData.description.autoPopulate"><TextArea control={control} disabled={isSubmitting} label={t("transactions.description")} minRows={3} name="templateData.description.value" required={descriptionRequired} rules={{ validate: requiredWhenHidden("description", t("templates.validation.descriptionRequired")) }} /></FieldRow>
    </Stack>
  );
}




