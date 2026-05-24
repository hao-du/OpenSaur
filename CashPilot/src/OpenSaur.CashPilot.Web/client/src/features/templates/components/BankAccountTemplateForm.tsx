import { Stack } from "@mui/material";
import { useWatch, type Control } from "react-hook-form";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number } from "../../../components/atoms/Number";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { TemplateFormValues } from "./TemplateForm";
import { FieldRow } from "./TemplateFormShared";

export function BankAccountTemplateForm({ banks, control, currencies, isSubmitting }: { banks: BankDto[]; control: Control<TemplateFormValues>; currencies: CurrencyDto[]; isSubmitting: boolean; }) {
  const { t } = useSettings();
  const templateData = useWatch({ control, name: "templateData" as never }) as {
    bankId?: { autoPopulate?: boolean };
    accountNumber?: { autoPopulate?: boolean };
    movementType?: { autoPopulate?: boolean };
    status?: { autoPopulate?: boolean };
    amount?: { autoPopulate?: boolean };
    currencyId?: { autoPopulate?: boolean };
    interestRate?: { autoPopulate?: boolean };
    startDate?: { autoPopulate?: boolean };
    maturityDate?: { autoPopulate?: boolean };
    description?: { autoPopulate?: boolean };
  } | undefined;

  const bankMode = templateData?.bankId?.autoPopulate;
  const accountNumberMode = templateData?.accountNumber?.autoPopulate;
  const movementTypeMode = templateData?.movementType?.autoPopulate;
  const statusMode = templateData?.status?.autoPopulate;
  const amountMode = templateData?.amount?.autoPopulate;
  const currencyMode = templateData?.currencyId?.autoPopulate;
  const interestRateMode = templateData?.interestRate?.autoPopulate;
  const startDateMode = templateData?.startDate?.autoPopulate;
  const maturityDateMode = templateData?.maturityDate?.autoPopulate;
  const descriptionMode = templateData?.description?.autoPopulate;

  const bankStatusOptions = [{ label: t("transactions.statusType.active"), value: "1" }, { label: t("transactions.statusType.matured"), value: "2" }, { label: t("transactions.statusType.closedEarly"), value: "3" }];
  const movementTypeOptions = [{ label: t("transactions.initialDeposit"), value: "1" }, { label: t("transactions.interestPayment"), value: "2" }, { label: t("transactions.principalReturn"), value: "3" }];
  const currencyOptions = currencies.map(x => ({ label: x.shortName, value: x.id }));
  const bankOptions = banks.map(x => ({ label: x.shortName, value: x.id }));

  return (
    <Stack spacing={2}>
      <FieldRow control={control} modeName="templateData.bankId.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.bank")} name="templateData.bankId.value" options={bankOptions} required={bankMode === true} rules={bankMode === true ? { required: t("transactions.validation.bankRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.accountNumber.autoPopulate"><Text control={control} disabled={isSubmitting} label={t("transactions.accountNumber")} name="templateData.accountNumber.value" required={accountNumberMode === true} rules={accountNumberMode === true ? { required: t("transactions.validation.accountNumberRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.movementType.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.movementType")} name="templateData.movementType.value" options={movementTypeOptions} required={movementTypeMode === true} rules={movementTypeMode === true ? { required: t("transactions.validation.typeRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.status.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.status")} name="templateData.status.value" options={bankStatusOptions} required={statusMode === true} rules={statusMode === true ? { required: t("transactions.validation.statusRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.amount.autoPopulate"><Number control={control} disabled={isSubmitting} label={t("transactions.amount")} name="templateData.amount.value" required={amountMode === true} rules={amountMode === true ? { required: t("transactions.validation.amountRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.currencyId.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.currency")} name="templateData.currencyId.value" options={currencyOptions} required={currencyMode === true} rules={currencyMode === true ? { required: t("transactions.validation.currencyRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.interestRate.autoPopulate"><Number control={control} disabled={isSubmitting} label={t("transactions.interestRate")} name="templateData.interestRate.value" required={interestRateMode === true} rules={interestRateMode === true ? { required: t("transactions.validation.interestRateRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.startDate.autoPopulate"><DatePicker control={control} label={t("transactions.startDate")} name="templateData.startDate.value" disabled={isSubmitting || startDateMode === true} required={startDateMode === true} rules={startDateMode === true ? { required: t("transactions.validation.startDateRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.maturityDate.autoPopulate"><DatePicker control={control} label={t("transactions.maturityDate")} name="templateData.maturityDate.value" disabled={isSubmitting || maturityDateMode === true} required={maturityDateMode === true} rules={maturityDateMode === true ? { required: t("transactions.validation.maturityDateRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.description.autoPopulate"><TextArea control={control} disabled={isSubmitting} label={t("transactions.description")} minRows={3} name="templateData.description.value" required={descriptionMode === true} rules={descriptionMode === true ? { required: t("templates.validation.descriptionRequired") } : undefined} /></FieldRow>
    </Stack>
  );
}



