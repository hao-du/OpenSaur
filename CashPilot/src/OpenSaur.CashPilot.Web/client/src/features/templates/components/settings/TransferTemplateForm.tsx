import { Stack } from "@mui/material";
import { useWatch, type Control } from "react-hook-form";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number } from "../../../../components/atoms/Number";
import { TextArea } from "../../../../components/atoms/TextArea";
import { useSettings } from "../../../settings/provider/SettingProvider";
import type { CounterpartyDto } from "../../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../../currencies/dtos/CurrencyDto";
import type { TemplateFormValues } from "./TemplateForm";
import { FieldRow } from "./TemplateFormShared";

export function TransferTemplateForm({ control, counterparties, currencies, isSubmitting }: { control: Control<TemplateFormValues>; counterparties: CounterpartyDto[]; currencies: CurrencyDto[]; isSubmitting: boolean; }) {
  const { t } = useSettings();
  const templateData = useWatch({ control, name: "templateData" as never }) as {
    counterpartyId?: { autoPopulate?: boolean };
    transferType?: { autoPopulate?: boolean };
    status?: { autoPopulate?: boolean };
    amount?: { autoPopulate?: boolean };
    currencyId?: { autoPopulate?: boolean };
    direction?: { autoPopulate?: boolean };
    transactionDate?: { autoPopulate?: boolean };
    dueDate?: { autoPopulate?: boolean };
    description?: { autoPopulate?: boolean };
  } | undefined;

  const counterpartyMode = templateData?.counterpartyId?.autoPopulate;
  const transferTypeMode = templateData?.transferType?.autoPopulate;
  const statusMode = templateData?.status?.autoPopulate;
  const amountMode = templateData?.amount?.autoPopulate;
  const currencyMode = templateData?.currencyId?.autoPopulate;
  const directionMode = templateData?.direction?.autoPopulate;
  const transactionDateMode = templateData?.transactionDate?.autoPopulate;
  const dueDateMode = templateData?.dueDate?.autoPopulate;
  const descriptionMode = templateData?.description?.autoPopulate;

  const transferTypeOptions = [{ label: t("transactions.transferType.lend"), value: "1" }, { label: t("transactions.transferType.borrow"), value: "2" }, { label: t("transactions.transferType.give"), value: "3" }, { label: t("transactions.transferType.receive"), value: "4" }];
  const transferStatusOptions = [{ label: t("transactions.statusType.active"), value: "1" }, { label: t("transactions.statusType.completed"), value: "2" }, { label: t("transactions.statusType.cancelled"), value: "3" }];
  const directionOptions = [{ label: t("transactions.directionIn"), value: "1" }, { label: t("transactions.directionOut"), value: "2" }];
  const currencyOptions = currencies.map(x => ({ label: x.shortName, value: x.id }));
  const counterpartyOptions = counterparties.map(x => ({ label: x.fullName, value: x.id }));

  return (
    <Stack spacing={2}>
      <FieldRow control={control} modeName="templateData.counterpartyId.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.counterparty")} name="templateData.counterpartyId.value" options={counterpartyOptions} required={counterpartyMode === true} rules={counterpartyMode === true ? { required: t("transactions.validation.counterpartyRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.transferType.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.type")} name="templateData.transferType.value" options={transferTypeOptions} required={transferTypeMode === true} rules={transferTypeMode === true ? { required: t("transactions.validation.typeRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.status.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.status")} name="templateData.status.value" options={transferStatusOptions} required={statusMode === true} rules={statusMode === true ? { required: t("transactions.validation.statusRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.amount.autoPopulate"><Number control={control} disabled={isSubmitting} label={t("transactions.amount")} name="templateData.amount.value" required={amountMode === true} rules={amountMode === true ? { required: t("transactions.validation.amountRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.currencyId.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.currency")} name="templateData.currencyId.value" options={currencyOptions} required={currencyMode === true} rules={currencyMode === true ? { required: t("transactions.validation.currencyRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.direction.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.direction")} name="templateData.direction.value" options={directionOptions} required={directionMode === true} rules={directionMode === true ? { required: t("transactions.validation.directionRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.transactionDate.autoPopulate"><DatePicker control={control} label={t("transactions.transactionDate")} name="templateData.transactionDate.value" disabled={isSubmitting || transactionDateMode === true} required={transactionDateMode === true} rules={transactionDateMode === true ? { required: t("transactions.validation.transactionDateRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.dueDate.autoPopulate"><DatePicker control={control} label={t("transactions.dueDate")} name="templateData.dueDate.value" disabled={isSubmitting || dueDateMode === true} required={dueDateMode === true} rules={dueDateMode === true ? { required: t("transactions.validation.dateRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.description.autoPopulate"><TextArea control={control} disabled={isSubmitting} label={t("transactions.description")} minRows={3} name="templateData.description.value" required={descriptionMode === true} rules={descriptionMode === true ? { required: t("templates.validation.descriptionRequired") } : undefined} /></FieldRow>
    </Stack>
  );
}

