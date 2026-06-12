import { useRef, useState } from "react";
import { WandSparkles } from "lucide-react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import { useSettings } from "../../settings/provider/SettingProvider";
import { TransferForm } from "../../transactions/components/TransferForm";
import type { SaveTransferFormRequestDto } from "../../transactions/dtos/TransactionDto";
import type { OfflineTransactionRecord } from "../storages/offlineTransactionsStore";
import type { TemplateData } from "../../templates/dtos/TemplateDto";
import { buildTransferInitialValue } from "../services/offlineTransactionFormUtils";

type Props = {
  counterparties: CounterpartyDto[]; 
  currencies: CurrencyDto[];
  editingTransaction?: OfflineTransactionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<OfflineTransactionRecord, "updatedAt">) => void;
  templateData?: TemplateData | null;
};

export function OfflineTransferFormDrawer({
  counterparties,
  currencies,
  editingTransaction,
  isOpen,
  onClose,
  onSave,
  templateData,
}: Props) {
  const { t, todayIsoDate } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoTagActionRef = useRef<(() => Promise<void>) | null>(null);
  const isBusy = isSubmitting;
  const initialValue = buildTransferInitialValue(templateData, counterparties, currencies, todayIsoDate, editingTransaction);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingTransaction == null ? t("transactions.createTransfer") : t("transactions.editTransfer")}
      width="wide"
    >
      <DrawerHeader />
      <DrawerBody>
        <TransferForm
          key={`${isOpen ? "open" : "closed"}-${editingTransaction?.id ?? "new"}`}
          counterparties={counterparties}
          currencies={currencies}
          formId="offline-transfer-form"
          isSubmitting={isSubmitting}
          movementInitialDetails={initialValue.movementInitialDetails}
          movementInitialTransactionItems={initialValue.movementInitialTransactionItems}
          movementInitialValue={initialValue.movementInitialValue}
          onAutoTagActionChange={(handler) => {
            autoTagActionRef.current = handler;
          }}
          onSave={async (payload: SaveTransferFormRequestDto) => {
            setIsSubmitting(true);
            try {
              const id = payload.id ?? editingTransaction?.id ?? crypto.randomUUID();
              const counterpartyName = counterparties.find((item) => item.id === payload.counterpartyId)?.fullName ?? null;
              const currencyCode = currencies.find((item) => item.id === payload.currencyId)?.shortName ?? payload.currencyId;
              const direction = payload.details[0]?.direction ?? null;
              const record: Omit<OfflineTransactionRecord, "updatedAt"> = {
                amount: payload.amount,
                bankAccountStatus: null,
                bankAccountTransactionType: null,
                bankName: null,
                counterpartyName,
                direction,
                currencyCode,
                description: payload.description ?? "",
                exchangeId: null,
                id,
                isActive: payload.isActive,
                payloadJson: JSON.stringify({ ...payload, id }),
                tags: payload.tags ?? [],
                transactionDate: payload.transactionDate,
                transferId: id,
                transferStatus: payload.status,
                transferType: payload.transferType,
                type: "Transfer",
              };
              onSave(record);
              onClose();
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton
            key="autoTag"
            disabled
            onClick={() => {
              void autoTagActionRef.current?.();
            }}
            startIcon={<WandSparkles size={16} />}
            variant="outlined"
          >
            {isBusy ? t("action.working") : t("transactions.autoTag")}
          </ActionButton>,
          <ActionButton key="submit" disabled={isBusy} form="offline-transfer-form" type="submit">
            {isBusy ? t("action.working") : editingTransaction == null ? t("transactions.create") : t("transactions.save")}
          </ActionButton>,
        ]}
      />
    </Drawer>
  );
}
