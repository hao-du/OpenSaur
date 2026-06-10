import { useState } from "react";
import type { TranslationKey } from "../../../settings/provider/translations";
import { ActionButton } from "../../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../../components/organisms/Drawer";
import { TransferPopulateForm } from "./TransferPopulateForm";
import type { OptionItem, TransferTemplateDataShape } from "./types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  t: (key: TranslationKey) => string;
  todayIsoDate: string;
  currencyOptions: OptionItem[];
  counterpartyOptions: OptionItem[];
  templateData: TransferTemplateDataShape;
  onSaved?: () => Promise<void> | void;
  error?: string | null;
};

export function TransferPopulateFormDrawer({
  isOpen,
  onClose,
  t,
  todayIsoDate,
  currencyOptions,
  counterpartyOptions,
  templateData,
  onSaved,
  error,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${t("templates.populate")} ${t("templates.templateType.transfer")}`}
      width="wide"
    >
      <DrawerHeader />
      <DrawerBody errorMessage={error ?? undefined}>
        <TransferPopulateForm
          formId="transfer-populate-form"
          counterpartyOptions={counterpartyOptions}
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
          <ActionButton key="submit" disabled={isSubmitting} form="transfer-populate-form" type="submit">
            {isSubmitting ? t("action.working") : t("transactions.create")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}
