import { useState } from "react";
import type { TranslationKey } from "../../../settings/provider/translations";
import { ActionButton } from "../../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../../components/organisms/Drawer";
import { OfflineCashFlowPopulateForm } from "./OfflineCashFlowPopulateForm";
import type { CashFlowTemplateDataShape, OptionItem } from "./types";
import type { OfflineTransactionRecord } from "../../storages/offlineTransactionsStore";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  t: (key: TranslationKey) => string;
  todayIsoDate: string;
  currencyOptions: OptionItem[];
  templateData: CashFlowTemplateDataShape;
  onSave: (record: Omit<OfflineTransactionRecord, "updatedAt">) => Promise<void> | void;
  error?: string | null;
};

export function OfflineCashFlowPopulateFormDrawer({
  isOpen,
  onClose,
  t,
  todayIsoDate,
  currencyOptions,
  templateData,
  onSave,
  error,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`${t("templates.populate")} ${t("templates.templateType.cashFlow")}`} width="wide">
      <DrawerHeader />
      <DrawerBody errorMessage={error ?? undefined}>
        <OfflineCashFlowPopulateForm
          formId="cash-flow-populate-form"
          currencyOptions={currencyOptions}
          onClose={onClose}
          onSave={onSave}
          onSubmittingChange={setIsSubmitting}
          t={t}
          templateData={templateData}
          todayIsoDate={todayIsoDate}
        />
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton key="submit" disabled={isSubmitting} form="cash-flow-populate-form" type="submit">
            {isSubmitting ? t("action.working") : t("transactions.create")}
          </ActionButton>,
        ]}
      />
    </Drawer>
  );
}
