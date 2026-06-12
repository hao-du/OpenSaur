import { useState } from "react";
import type { TranslationKey } from "../../../settings/provider/translations";
import { ActionButton } from "../../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../../components/organisms/Drawer";
import { OfflineTransferPopulateForm } from "./OfflineTransferPopulateForm";
import type { OptionItem, TransferTemplateDataShape } from "./types";
import type { OfflineTransactionRecord } from "../../storages/offlineTransactionsStore";

type Props = {
  counterpartyOptions: OptionItem[];
  currencyOptions: OptionItem[];
  isOpen: boolean;
  onClose: () => void;
  t: (key: TranslationKey) => string;
  todayIsoDate: string;
  templateData: TransferTemplateDataShape;
  onSave: (record: Omit<OfflineTransactionRecord, "updatedAt">) => Promise<void> | void;
  error?: string | null;
};

export function OfflineTransferPopulateFormDrawer({
  counterpartyOptions,
  currencyOptions,
  isOpen,
  onClose,
  t,
  todayIsoDate,
  templateData,
  onSave,
  error,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`${t("templates.populate")} ${t("templates.templateType.transfer")}`} width="wide">
      <DrawerHeader />
      <DrawerBody errorMessage={error ?? undefined}>
        <OfflineTransferPopulateForm
          counterpartyOptions={counterpartyOptions}
          currencyOptions={currencyOptions}
          formId="transfer-populate-form"
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
          <ActionButton key="submit" disabled={isSubmitting} form="transfer-populate-form" type="submit">
            {isSubmitting ? t("action.working") : t("transactions.create")}
          </ActionButton>,
        ]}
      />
    </Drawer>
  );
}
