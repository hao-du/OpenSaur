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
import type { CashFlowTemplateFormProps } from "./types";
import {
  clearErrorsWhenNotRequired,
  requiredWhenAutoHidden,
  toOptions,
} from "./utils";

export function CashFlowTemplateForm({
  control,
  currencies,
  isSubmitting,
}: CashFlowTemplateFormProps) {
  const { t } = useSettings();
  const { clearErrors, getValues } = useFormContext<TemplateFormValues>();
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
  const descriptionMode = useWatch({
    control,
    name: "templateData.description.autoPopulate",
  });
  const descriptionShowUi = useWatch({
    control,
    name: "templateData.description.showUi",
  });
  const amountRequired = amountMode === true && amountShowUi !== true;
  const currencyRequired = currencyMode === true && currencyShowUi !== true;
  const directionRequired = directionMode === true && directionShowUi !== true;
  const transactionDateRequired =
    transactionDateMode === true && transactionDateShowUi !== true;
  const descriptionRequired =
    descriptionMode === true && descriptionShowUi !== true;
  const directionOptions = [
    { label: t("transactions.directionIn"), value: "1" },
    { label: t("transactions.directionOut"), value: "2" },
  ];
  const currencyOptions = toOptions(
    currencies,
    (x) => x.shortName,
    (x) => x.id,
  );
  type CashFlowFieldKey =
    | "amount"
    | "currencyId"
    | "direction"
    | "transactionDate"
    | "description";
  const requiredWhenHidden = (valuePath: CashFlowFieldKey, message: string) =>
    requiredWhenAutoHidden(getValues, valuePath, message);

  useEffect(() => {
    clearErrorsWhenNotRequired(clearErrors, [
      { path: "templateData.amount.value", required: amountRequired },
      { path: "templateData.currencyId.value", required: currencyRequired },
      { path: "templateData.direction.value", required: directionRequired },
      {
        path: "templateData.transactionDate.value",
        required: transactionDateRequired,
      },
      { path: "templateData.description.value", required: descriptionRequired },
    ]);
  }, [
    amountRequired,
    clearErrors,
    currencyRequired,
    descriptionRequired,
    directionRequired,
    transactionDateRequired,
  ]);

  return (
    <Stack spacing={2}>
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
