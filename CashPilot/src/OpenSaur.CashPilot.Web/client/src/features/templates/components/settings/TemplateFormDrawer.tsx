import { FormProvider, useWatch, type UseFormReturn } from "react-hook-form";
import { ActionButton } from "../../../../components/atoms/ActionButton";
import { FormTitleHelpIcon } from "../../../../components/atoms/FormTitleHelpIcon";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../../components/organisms/Drawer";
import type { BankDto } from "../../../banks/dtos/BankDto";
import type { CounterpartyDto } from "../../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../../currencies/dtos/CurrencyDto";
import { useSettings } from "../../../settings/provider/SettingProvider";
import { TemplateForm, type TemplateFormValues } from "./TemplateForm";
import {
  useTemplateAutoDateEffect,
  useTemplateDefaultValueEffect,
  useTemplateTypeResetEffect,
} from "./TemplateFormDrawerEffects";

type Props = {
  form: UseFormReturn<TemplateFormValues>;
  isEditMode: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: TemplateFormValues) => Promise<void>;
  banks: BankDto[];
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
};

export function TemplateFormDrawer({
  banks,
  counterparties,
  currencies,
  form,
  isEditMode,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const { t, todayIsoDate } = useSettings();
  const selectedType = useWatch({
    control: form.control,
    name: "templateType",
  });

  const watchedTemplateData = useWatch({
    control: form.control,
    name: "templateData" as never,
  }) as
    | (Record<
        string,
        { autoPopulate?: boolean; value?: string } | undefined
      > & {
        details?: Array<{
          transactionDate?: { autoPopulate?: boolean; value?: string };
        }>;
      })
    | undefined;
  const currencyMode = watchedTemplateData?.currencyId?.autoPopulate;
  const outCurrencyMode = watchedTemplateData?.outCurrencyId?.autoPopulate;
  const inCurrencyMode = watchedTemplateData?.inCurrencyId?.autoPopulate;
  const bankMode = watchedTemplateData?.bankId?.autoPopulate;

  useTemplateTypeResetEffect(form, isOpen, selectedType);
  useTemplateAutoDateEffect(form, todayIsoDate, watchedTemplateData);
  useTemplateDefaultValueEffect(
    form,
    isOpen,
    selectedType,
    currencies,
    banks,
    currencyMode,
    outCurrencyMode,
    inCurrencyMode,
    bankMode,
  );

  const typeTitle =
    selectedType === "CashFlow"
      ? t("templates.templateType.cashFlow")
      : selectedType === "Transfer"
        ? t("templates.templateType.transfer")
        : selectedType === "Exchange"
          ? t("templates.templateType.exchange")
          : t("templates.templateType.bankAccount");

  const title = `${isEditMode ? t("templates.editTitle") : t("templates.createTitle")} ${typeTitle}`;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="wide"
      titleAction={(
        <FormTitleHelpIcon
          ariaLabel={t("common.showDetails")}
          message={t("templates.formulaHint")}
        />
      )}
    >
      <FormProvider {...form}>
        <DrawerHeader />
        <DrawerBody
          component="form"
          id="template-form"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <TemplateForm
            banks={banks}
            control={form.control}
            counterparties={counterparties}
            currencies={currencies}
            isSubmitting={isSubmitting}
          />
        </DrawerBody>
        <DrawerFooter
          actions={[
            <ActionButton key="submit" form="template-form" disabled={isSubmitting} type="submit">
              {isSubmitting ? t("action.working") : isEditMode ? t("common.save") : t("templates.create")}
            </ActionButton>
          ]}
        />
      </FormProvider>
    </Drawer>
  );
}

