import { Stack } from "@mui/material";
import { useFieldArray, useWatch, type Control } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number } from "../../../components/atoms/Number";
import { TextArea } from "../../../components/atoms/TextArea";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { TemplateFormValues } from "./TemplateForm";
import { FieldRow } from "./TemplateFormShared";

export function TransferTemplateForm({ control, counterparties, currencies, isSubmitting }: { control: Control<TemplateFormValues>; counterparties: CounterpartyDto[]; currencies: CurrencyDto[]; isSubmitting: boolean; }) {
  const { t } = useSettings();
  const { fields, append, remove } = useFieldArray({ control, name: "templateData.details" as never });
  const templateData = useWatch({ control, name: "templateData" as never }) as {
    counterpartyId?: { autoPopulate?: boolean };
    transferType?: { autoPopulate?: boolean };
    status?: { autoPopulate?: boolean };
    currencyId?: { autoPopulate?: boolean };
    transactionDate?: { autoPopulate?: boolean };
    dueDate?: { autoPopulate?: boolean };
    description?: { autoPopulate?: boolean };
    details?: Array<{
      amount?: { autoPopulate?: boolean };
      direction?: { autoPopulate?: boolean };
      transactionDate?: { autoPopulate?: boolean };
      description?: { autoPopulate?: boolean };
    }>;
  } | undefined;
  const counterpartyMode = templateData?.counterpartyId?.autoPopulate;
  const transferTypeMode = templateData?.transferType?.autoPopulate;
  const statusMode = templateData?.status?.autoPopulate;
  const currencyMode = templateData?.currencyId?.autoPopulate;
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
      <FieldRow control={control} modeName="templateData.currencyId.autoPopulate"><DropDown control={control} disabled={isSubmitting} label={t("transactions.currency")} name="templateData.currencyId.value" options={currencyOptions} required={currencyMode === true} rules={currencyMode === true ? { required: t("transactions.validation.currencyRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.transactionDate.autoPopulate"><DatePicker control={control} label={t("transactions.transactionDate")} name="templateData.transactionDate.value" disabled={isSubmitting || transactionDateMode === true} required={transactionDateMode === true} rules={transactionDateMode === true ? { required: t("transactions.validation.transactionDateRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.dueDate.autoPopulate"><DatePicker control={control} label={t("transactions.dueDate")} name="templateData.dueDate.value" disabled={isSubmitting || dueDateMode === true} required={dueDateMode === true} rules={dueDateMode === true ? { required: t("transactions.validation.dateRequired") } : undefined} /></FieldRow>
      <FieldRow control={control} modeName="templateData.description.autoPopulate"><TextArea control={control} disabled={isSubmitting} label={t("transactions.description")} minRows={3} name="templateData.description.value" required={descriptionMode === true} rules={descriptionMode === true ? { required: t("templates.validation.descriptionRequired") } : undefined} /></FieldRow>

      <Stack alignItems="center" direction="row" justifyContent="space-between" sx={{ pt: 1 }}>
        <h3 style={{ margin: 0 }}>{t("transactions.transactionDetails")}</h3>
        <ActionButton color="secondary" disabled={isSubmitting} onClick={() => append({ amount: { autoPopulate: false, value: "" }, description: { autoPopulate: false, value: "" }, direction: { autoPopulate: false, value: "1" }, transactionDate: { autoPopulate: false, value: "" } } as never)} size="small">{t("transactions.addTransaction")}</ActionButton>
      </Stack>

      {fields.map((field, index) => {
        const detail = templateData?.details?.[index];
        const detailAmountMode = detail?.amount?.autoPopulate;
        const detailDirectionMode = detail?.direction?.autoPopulate;
        const detailDateMode = detail?.transactionDate?.autoPopulate;
        const detailDescriptionMode = detail?.description?.autoPopulate;

        return (
          <Stack key={field.id} spacing={1.25} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
            <Stack alignItems="center" direction="row" justifyContent="space-between">
              <strong>{`${t("transactions.addTransaction")} ${index + 1}`}</strong>
              <ActionButton color="error" disabled={isSubmitting} onClick={() => remove(index)} size="small" variant="outlined">{t("transactions.delete")}</ActionButton>
            </Stack>
            <FieldRow control={control} modeName={`templateData.details.${index}.amount.autoPopulate`}><Number control={control} disabled={isSubmitting} label={t("transactions.amount")} name={`templateData.details.${index}.amount.value` as never} required={detailAmountMode === true} rules={detailAmountMode === true ? { required: t("transactions.validation.amountRequired") } : undefined} /></FieldRow>
            <FieldRow control={control} modeName={`templateData.details.${index}.direction.autoPopulate`}><DropDown control={control} disabled={isSubmitting} label={t("transactions.direction")} name={`templateData.details.${index}.direction.value` as never} options={directionOptions} required={detailDirectionMode === true} rules={detailDirectionMode === true ? { required: t("transactions.validation.directionRequired") } : undefined} /></FieldRow>
            <FieldRow control={control} modeName={`templateData.details.${index}.transactionDate.autoPopulate`}><DatePicker control={control} label={t("transactions.transactionDate")} name={`templateData.details.${index}.transactionDate.value` as never} disabled={isSubmitting || detailDateMode === true} required={detailDateMode === true} rules={detailDateMode === true ? { required: t("transactions.validation.transactionDateRequired") } : undefined} /></FieldRow>
            <FieldRow control={control} modeName={`templateData.details.${index}.description.autoPopulate`}><TextArea control={control} disabled={isSubmitting} label={t("transactions.description")} minRows={2} name={`templateData.details.${index}.description.value` as never} required={detailDescriptionMode === true} rules={detailDescriptionMode === true ? { required: t("templates.validation.descriptionRequired") } : undefined} /></FieldRow>
          </Stack>
        );
      })}
    </Stack>
  );
}



