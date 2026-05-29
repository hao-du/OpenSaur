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
import type { TransferTemplateFormProps } from "./types";
import {
  clearErrorsWhenNotRequired,
  requiredWhenAutoHidden,
  toOptions,
} from "./utils";

export function TransferTemplateForm({
  control,
  counterparties,
  currencies,
  isSubmitting,
}: TransferTemplateFormProps) {
  const { t } = useSettings();
  const { clearErrors, getValues } = useFormContext<TemplateFormValues>();
  const counterpartyMode = useWatch({
    control,
    name: "templateData.counterpartyId.autoPopulate",
  });
  const counterpartyShowUi = useWatch({
    control,
    name: "templateData.counterpartyId.showUi",
  });
  const transferTypeMode = useWatch({
    control,
    name: "templateData.transferType.autoPopulate",
  });
  const transferTypeShowUi = useWatch({
    control,
    name: "templateData.transferType.showUi",
  });
  const statusMode = useWatch({
    control,
    name: "templateData.status.autoPopulate",
  });
  const statusShowUi = useWatch({
    control,
    name: "templateData.status.showUi",
  });
  const amountMode = useWatch({
    control,
    name: "templateData.amount.autoPopulate",
  });
  const amountShowUi = useWatch({
    control,
    name: "templateData.amount.showUi",
  });
  const currencyMode = useWatch({
    control,
    name: "templateData.currencyId.autoPopulate",
  });
  const currencyShowUi = useWatch({
    control,
    name: "templateData.currencyId.showUi",
  });
  const directionMode = useWatch({
    control,
    name: "templateData.direction.autoPopulate",
  });
  const directionShowUi = useWatch({
    control,
    name: "templateData.direction.showUi",
  });
  const transactionDateMode = useWatch({
    control,
    name: "templateData.transactionDate.autoPopulate",
  });
  const transactionDateShowUi = useWatch({
    control,
    name: "templateData.transactionDate.showUi",
  });
  const dueDateMode = useWatch({
    control,
    name: "templateData.dueDate.autoPopulate",
  });
  const dueDateShowUi = useWatch({
    control,
    name: "templateData.dueDate.showUi",
  });
  const descriptionMode = useWatch({
    control,
    name: "templateData.description.autoPopulate",
  });
  const descriptionShowUi = useWatch({
    control,
    name: "templateData.description.showUi",
  });
  const counterpartyRequired =
    counterpartyMode === true && counterpartyShowUi !== true;
  const transferTypeRequired =
    transferTypeMode === true && transferTypeShowUi !== true;
  const statusRequired = statusMode === true && statusShowUi !== true;
  const amountRequired = amountMode === true && amountShowUi !== true;
  const currencyRequired = currencyMode === true && currencyShowUi !== true;
  const directionRequired = directionMode === true && directionShowUi !== true;
  const transactionDateRequired =
    transactionDateMode === true && transactionDateShowUi !== true;
  const dueDateRequired = dueDateMode === true && dueDateShowUi !== true;
  const descriptionRequired =
    descriptionMode === true && descriptionShowUi !== true;

  const transferTypeOptions = [
    { label: t("transactions.transferType.lend"), value: "1" },
    { label: t("transactions.transferType.borrow"), value: "2" },
    { label: t("transactions.transferType.give"), value: "3" },
    { label: t("transactions.transferType.receive"), value: "4" },
  ];
  const transferStatusOptions = [
    { label: t("transactions.statusType.active"), value: "1" },
    { label: t("transactions.statusType.completed"), value: "2" },
    { label: t("transactions.statusType.cancelled"), value: "3" },
  ];
  const directionOptions = [
    { label: t("transactions.directionIn"), value: "1" },
    { label: t("transactions.directionOut"), value: "2" },
  ];
  const currencyOptions = toOptions(
    currencies,
    (x) => x.shortName,
    (x) => x.id,
  );
  const counterpartyOptions = toOptions(
    counterparties,
    (x) => x.fullName,
    (x) => x.id,
  );
  type TransferFieldKey =
    | "counterpartyId"
    | "transferType"
    | "status"
    | "amount"
    | "currencyId"
    | "direction"
    | "transactionDate"
    | "dueDate"
    | "description";
  const requiredWhenHidden = (valuePath: TransferFieldKey, message: string) =>
    requiredWhenAutoHidden(getValues, valuePath, message);
  useEffect(() => {
    clearErrorsWhenNotRequired(clearErrors, [
      {
        path: "templateData.counterpartyId.value",
        required: counterpartyRequired,
      },
      {
        path: "templateData.transferType.value",
        required: transferTypeRequired,
      },
      { path: "templateData.status.value", required: statusRequired },
      { path: "templateData.amount.value", required: amountRequired },
      { path: "templateData.currencyId.value", required: currencyRequired },
      { path: "templateData.direction.value", required: directionRequired },
      {
        path: "templateData.transactionDate.value",
        required: transactionDateRequired,
      },
      { path: "templateData.dueDate.value", required: dueDateRequired },
      { path: "templateData.description.value", required: descriptionRequired },
    ]);
  }, [
    amountRequired,
    clearErrors,
    counterpartyRequired,
    currencyRequired,
    descriptionRequired,
    directionRequired,
    dueDateRequired,
    statusRequired,
    transactionDateRequired,
    transferTypeRequired,
  ]);

  return (
    <Stack spacing={2}>
      <FieldRow
        control={control}
        modeName="templateData.counterpartyId.autoPopulate"
      >
        <DropDown
          control={control}
          disabled={isSubmitting}
          label={t("transactions.counterparty")}
          name="templateData.counterpartyId.value"
          options={counterpartyOptions}
          required={counterpartyRequired}
          rules={{
            validate: requiredWhenHidden(
              "counterpartyId",
              t("transactions.validation.counterpartyRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow
        control={control}
        modeName="templateData.transferType.autoPopulate"
      >
        <DropDown
          control={control}
          disabled={isSubmitting}
          label={t("transactions.type")}
          name="templateData.transferType.value"
          options={transferTypeOptions}
          required={transferTypeRequired}
          rules={{
            validate: requiredWhenHidden(
              "transferType",
              t("transactions.validation.typeRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow control={control} modeName="templateData.status.autoPopulate">
        <DropDown
          control={control}
          disabled={isSubmitting}
          label={t("transactions.status")}
          name="templateData.status.value"
          options={transferStatusOptions}
          required={statusRequired}
          rules={{
            validate: requiredWhenHidden(
              "status",
              t("transactions.validation.statusRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow control={control} modeName="templateData.amount.autoPopulate">
        <Number
          control={control}
          disabled={isSubmitting}
          label={t("transactions.amount")}
          name="templateData.amount.value"
          required={amountRequired}
          rules={{
            validate: requiredWhenHidden(
              "amount",
              t("transactions.validation.amountRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow
        control={control}
        modeName="templateData.currencyId.autoPopulate"
      >
        <DropDown
          control={control}
          disabled={isSubmitting}
          label={t("transactions.currency")}
          name="templateData.currencyId.value"
          options={currencyOptions}
          required={currencyRequired}
          rules={{
            validate: requiredWhenHidden(
              "currencyId",
              t("transactions.validation.currencyRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow
        control={control}
        modeName="templateData.direction.autoPopulate"
      >
        <DropDown
          control={control}
          disabled={isSubmitting}
          label={t("transactions.direction")}
          name="templateData.direction.value"
          options={directionOptions}
          required={directionRequired}
          rules={{
            validate: requiredWhenHidden(
              "direction",
              t("transactions.validation.directionRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow
        control={control}
        modeName="templateData.transactionDate.autoPopulate"
      >
        <DatePicker
          control={control}
          label={t("transactions.transactionDate")}
          name="templateData.transactionDate.value"
          disabled={isSubmitting || transactionDateMode === true}
          required={transactionDateRequired}
          rules={{
            validate: requiredWhenHidden(
              "transactionDate",
              t("transactions.validation.transactionDateRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow
        allowManualHide
        control={control}
        modeName="templateData.dueDate.autoPopulate"
      >
        <DatePicker
          control={control}
          label={t("transactions.dueDate")}
          name="templateData.dueDate.value"
          disabled={isSubmitting || dueDateMode === true}
          required={dueDateRequired}
          rules={{
            validate: requiredWhenHidden(
              "dueDate",
              t("transactions.validation.dateRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow
        allowManualHide
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
