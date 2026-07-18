import { useState } from "react";
import type { TranslationKey } from "../../../settings/provider/translations";
import { ActionButton } from "../../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../../components/organisms/Drawer";
import { BankAccountPopulateForm } from "./BankAccountPopulateForm";
import type { BankAccountTemplateDataShape, OptionItem } from "./types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  t: (key: TranslationKey) => string;
  todayIsoDate: string;
  bankOptions: OptionItem[];
  currencyOptions: OptionItem[];
  templateData: BankAccountTemplateDataShape;
  onSaved?: () => Promise<void> | void;
  error?: string | null;
};

export function BankAccountPopulateFormDrawer({
  isOpen,
  onClose,
  t,
  todayIsoDate,
  bankOptions,
  currencyOptions,
  templateData,
  onSaved,
  error,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${t("templates.populate")} ${t("templates.templateType.bankAccount")}`}
      width="wide"
    >
      <DrawerHeader />
      <DrawerBody errorMessage={error ?? undefined}>
        <BankAccountPopulateForm
          formId="bank-account-populate-form"
          bankOptions={bankOptions}
          currencyOptions={currencyOptions}
          onClose={onClose}
          onSaved={onSaved}
          onSubmittingChange={setIsSubmitting}
          t={t}
          templateData={templateData}
          todayIsoDate={todayIsoDate}
        />
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton key="submit" disabled={isSubmitting} form="bank-account-populate-form" type="submit">
            {isSubmitting ? t("action.working") : t("transactions.create")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}
