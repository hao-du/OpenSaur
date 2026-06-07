import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { BankDto } from "../../../banks/dtos/BankDto";
import type { CurrencyDto } from "../../../currencies/dtos/CurrencyDto";
import type { TemplateType } from "../../dtos/TemplateDto";
import { buildDefaultTemplateData } from "./TemplateDataCodec";
import type { TemplateFormValues } from "./TemplateForm";

type TemplateDataWatch = Record<
  string,
  { autoPopulate?: boolean; value?: string } | undefined
> & {
  details?: Array<{
    transactionDate?: { autoPopulate?: boolean; value?: string };
  }>;
};

export function useTemplateTypeResetEffect(
  form: UseFormReturn<TemplateFormValues>,
  isOpen: boolean,
  selectedType: TemplateType,
) {
  const previousTypeRef =
    useRef<TemplateFormValues["templateType"]>(selectedType);

  useEffect(() => {
    if (!isOpen) {
      previousTypeRef.current = selectedType;
      return;
    }

    const previousType = previousTypeRef.current;
    if (selectedType !== previousType && form.formState.isDirty) {
      form.setValue("templateData", buildDefaultTemplateData(selectedType), {
        shouldDirty: true,
        shouldValidate: false,
      });
    }

    if (selectedType === "BankAccount") {
      form.setValue("templateData.status.value" as never, "1" as never, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }

    previousTypeRef.current = selectedType;
  }, [form, isOpen, selectedType]);
}

export function useTemplateAutoDateEffect(
  form: UseFormReturn<TemplateFormValues>,
  todayIsoDate: string,
  watchedTemplateData: TemplateDataWatch | undefined,
) {
  const transactionDateMode =
    watchedTemplateData?.transactionDate?.autoPopulate;
  const dueDateMode = watchedTemplateData?.dueDate?.autoPopulate;
  const exchangeDateMode = watchedTemplateData?.exchangeDate?.autoPopulate;
  const startDateMode = watchedTemplateData?.startDate?.autoPopulate;
  const maturityDateMode = watchedTemplateData?.maturityDate?.autoPopulate;

  useEffect(() => {
    const autoDatePaths = [
      [transactionDateMode, "templateData.transactionDate.value"],
      [dueDateMode, "templateData.dueDate.value"],
      [exchangeDateMode, "templateData.exchangeDate.value"],
      [startDateMode, "templateData.startDate.value"],
      [maturityDateMode, "templateData.maturityDate.value"],
    ] as const;

    autoDatePaths.forEach(([mode, path]) => {
      if (mode === true) {
        const current = String(form.getValues(path as never) ?? "");
        if (current !== todayIsoDate) {
          form.setValue(path as never, todayIsoDate as never, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      }
    });

    watchedTemplateData?.details?.forEach((detail, index) => {
      if (detail?.transactionDate?.autoPopulate === true) {
        const datePath = `templateData.details.${index}.transactionDate.value`;
        const current = String(form.getValues(datePath as never) ?? "");
        if (current !== todayIsoDate) {
          form.setValue(datePath as never, todayIsoDate as never, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      }
    });
  }, [
    transactionDateMode,
    dueDateMode,
    exchangeDateMode,
    startDateMode,
    maturityDateMode,
    watchedTemplateData,
    form,
    todayIsoDate,
  ]);
}

export function useTemplateDefaultValueEffect(
  form: UseFormReturn<TemplateFormValues>,
  isOpen: boolean,
  selectedType: TemplateType,
  currencies: CurrencyDto[],
  banks: BankDto[],
  currencyMode: boolean | undefined,
  outCurrencyMode: boolean | undefined,
  inCurrencyMode: boolean | undefined,
  bankMode: boolean | undefined,
) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const defaultCurrencyId =
      currencies.find((x) => x.isDefault)?.id ?? currencies[0]?.id ?? "";
    const defaultBankId =
      banks.find((x) => x.isDefault)?.id ?? banks[0]?.id ?? "";

    const setIfEmpty = (path: string, value: string) => {
      const current = String(form.getValues(path as never) ?? "").trim();
      if (current.length === 0 && value.length > 0) {
        form.setValue(path as never, value as never, {
          shouldDirty: false,
          shouldValidate: true,
        });
      }
    };
    const setAlways = (path: string, value: string) => {
      if (value.length > 0) {
        form.setValue(path as never, value as never, {
          shouldDirty: false,
          shouldValidate: true,
        });
      }
    };

    if (selectedType === "CashFlow") {
      setAlways("templateData.currencyId.value", defaultCurrencyId);
      setIfEmpty("templateData.direction.value", "2");
    }

    if (selectedType === "Transfer") {
      setAlways("templateData.currencyId.value", defaultCurrencyId);
      setIfEmpty("templateData.transferType.value", "1");
      setIfEmpty("templateData.status.value", "1");
    }

    if (selectedType === "Exchange") {
      setAlways("templateData.outCurrencyId.value", defaultCurrencyId);
      setAlways("templateData.inCurrencyId.value", defaultCurrencyId);
    }

    if (selectedType === "BankAccount") {
      setAlways("templateData.bankId.value", defaultBankId);
      setAlways("templateData.currencyId.value", defaultCurrencyId);
      setIfEmpty("templateData.status.value", "1");
    }

    if (currencyMode === true) {
      form.setValue(
        "templateData.currencyId.value" as never,
        defaultCurrencyId as never,
        { shouldDirty: true, shouldValidate: true },
      );
    }
    if (outCurrencyMode === true) {
      form.setValue(
        "templateData.outCurrencyId.value" as never,
        defaultCurrencyId as never,
        { shouldDirty: true, shouldValidate: true },
      );
    }
    if (inCurrencyMode === true) {
      form.setValue(
        "templateData.inCurrencyId.value" as never,
        defaultCurrencyId as never,
        { shouldDirty: true, shouldValidate: true },
      );
    }
    if (bankMode === true) {
      form.setValue(
        "templateData.bankId.value" as never,
        defaultBankId as never,
        { shouldDirty: true, shouldValidate: true },
      );
    }
  }, [
    banks,
    currencies,
    currencyMode,
    outCurrencyMode,
    inCurrencyMode,
    bankMode,
    form,
    isOpen,
    selectedType,
  ]);
}
