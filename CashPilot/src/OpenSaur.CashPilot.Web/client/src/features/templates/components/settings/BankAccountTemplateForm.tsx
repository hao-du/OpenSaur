import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { DropDown } from "../../../../components/atoms/DropDown";
import { Number } from "../../../../components/atoms/Number";
import { Text } from "../../../../components/atoms/Text";
import { TextArea } from "../../../../components/atoms/TextArea";
import { useSettings } from "../../../settings/provider/SettingProvider";
import type { TemplateFormValues } from "./TemplateForm";
import { FieldRow } from "./TemplateFormShared";
import type { BankAccountTemplateFormProps } from "./types";
import {
  clearErrorsWhenNotRequired,
  requiredWhenAutoHidden,
  toOptions,
} from "./utils";

export function BankAccountTemplateForm({
  banks,
  control,
  currencies,
  isSubmitting,
}: BankAccountTemplateFormProps) {
  const { t } = useSettings();
  const { clearErrors, getValues } = useFormContext<TemplateFormValues>();
  const bankMode = useWatch({
    control,
    name: "templateData.bankId.autoPopulate",
  });
  const bankShowUi = useWatch({ control, name: "templateData.bankId.showUi" });
  const accountNumberMode = useWatch({
    control,
    name: "templateData.accountNumber.autoPopulate",
  });
  const accountNumberShowUi = useWatch({
    control,
    name: "templateData.accountNumber.showUi",
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
  const interestRateMode = useWatch({
    control,
    name: "templateData.interestRate.autoPopulate",
  });
  const interestRateShowUi = useWatch({
    control,
    name: "templateData.interestRate.showUi",
  });
  const startDateMode = useWatch({
    control,
    name: "templateData.startDate.autoPopulate",
  });
  const startDateShowUi = useWatch({
    control,
    name: "templateData.startDate.showUi",
  });
  const maturityDateMode = useWatch({
    control,
    name: "templateData.maturityDate.autoPopulate",
  });
  const maturityDateShowUi = useWatch({
    control,
    name: "templateData.maturityDate.showUi",
  });
  const descriptionMode = useWatch({
    control,
    name: "templateData.description.autoPopulate",
  });
  const descriptionShowUi = useWatch({
    control,
    name: "templateData.description.showUi",
  });
  const bankRequired = bankMode === true && bankShowUi !== true;
  const accountNumberRequired =
    accountNumberMode === true && accountNumberShowUi !== true;
  const amountRequired = amountMode === true && amountShowUi !== true;
  const currencyRequired = currencyMode === true && currencyShowUi !== true;
  const interestRateRequired =
    interestRateMode === true && interestRateShowUi !== true;
  const startDateRequired = startDateMode === true && startDateShowUi !== true;
  const maturityDateRequired =
    maturityDateMode === true && maturityDateShowUi !== true;
  const descriptionRequired =
    descriptionMode === true && descriptionShowUi !== true;

  const currencyOptions = toOptions(
    currencies,
    (x) => x.shortName,
    (x) => x.id,
  );
  const bankOptions = toOptions(
    banks,
    (x) => x.shortName,
    (x) => x.id,
  );
  type BankFieldKey =
    | "bankId"
    | "accountNumber"
    | "amount"
    | "currencyId"
    | "interestRate"
    | "startDate"
    | "maturityDate"
    | "description";
  const requiredWhenHidden = (valuePath: BankFieldKey, message: string) =>
    requiredWhenAutoHidden(getValues, valuePath, message);
  const validateInterestRate = (value: unknown) => {
    if (interestRateMode !== true) {
      return true;
    }

    if (value == null || String(value).trim().length === 0) {
      return t("transactions.validation.interestRateRequired");
    }

    const parsed = globalThis.Number(value);
    if (!globalThis.Number.isFinite(parsed)) {
      return t("transactions.validation.interestRateInvalid");
    }

    return parsed >= 0 && parsed <= 100
      ? true
      : t("transactions.validation.interestRateRange");
  };
  useEffect(() => {
    clearErrorsWhenNotRequired(clearErrors, [
      { path: "templateData.bankId.value", required: bankRequired },
      {
        path: "templateData.accountNumber.value",
        required: accountNumberRequired,
      },
      { path: "templateData.amount.value", required: amountRequired },
      { path: "templateData.currencyId.value", required: currencyRequired },
      {
        path: "templateData.interestRate.value",
        required: interestRateRequired,
      },
      { path: "templateData.startDate.value", required: startDateRequired },
      {
        path: "templateData.maturityDate.value",
        required: maturityDateRequired,
      },
      { path: "templateData.description.value", required: descriptionRequired },
    ]);
  }, [
    accountNumberRequired,
    amountRequired,
    bankRequired,
    clearErrors,
    currencyRequired,
    descriptionRequired,
    interestRateRequired,
    maturityDateRequired,
    startDateRequired,
  ]);

  return (
    <Stack spacing={2}>
      <FieldRow control={control} modeName="templateData.bankId.autoPopulate">
        <DropDown
          control={control}
          disabled={isSubmitting}
          label={t("transactions.bank")}
          name="templateData.bankId.value"
          options={bankOptions}
          required={bankRequired}
          rules={{
            validate: requiredWhenHidden(
              "bankId",
              t("transactions.validation.bankRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow
        allowManualHide
        control={control}
        modeName="templateData.accountNumber.autoPopulate"
      >
        <Text
          control={control}
          disabled={isSubmitting}
          label={t("transactions.accountNumber")}
          name="templateData.accountNumber.value"
          required={accountNumberRequired}
          rules={{
            validate: requiredWhenHidden(
              "accountNumber",
              t("transactions.validation.accountNumberRequired"),
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
        allowManualHide
        control={control}
        modeName="templateData.interestRate.autoPopulate"
      >
        <Number
          control={control}
          disabled={isSubmitting}
          label={t("transactions.interestRate")}
          name="templateData.interestRate.value"
          required={interestRateRequired}
          rules={{
            validate: (value) => {
              const requiredResult = requiredWhenHidden(
                "interestRate",
                t("transactions.validation.interestRateRequired"),
              )(value);
              if (requiredResult !== true) {
                return requiredResult;
              }
              return validateInterestRate(value);
            },
          }}
        />
      </FieldRow>
      <FieldRow
        control={control}
        modeName="templateData.startDate.autoPopulate"
      >
        <DatePicker
          control={control}
          label={t("transactions.startDate")}
          name="templateData.startDate.value"
          disabled={isSubmitting || startDateMode === true}
          required={startDateRequired}
          rules={{
            validate: requiredWhenHidden(
              "startDate",
              t("transactions.validation.startDateRequired"),
            ),
          }}
        />
      </FieldRow>
      <FieldRow
        allowManualHide
        control={control}
        modeName="templateData.maturityDate.autoPopulate"
      >
        <DatePicker
          control={control}
          label={t("transactions.maturityDate")}
          name="templateData.maturityDate.value"
          disabled={isSubmitting || maturityDateMode === true}
          required={maturityDateRequired}
          rules={{
            validate: requiredWhenHidden(
              "maturityDate",
              t("transactions.validation.maturityDateRequired"),
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
