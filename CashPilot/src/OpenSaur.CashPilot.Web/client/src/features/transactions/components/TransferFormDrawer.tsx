import { useState } from "react";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { TransactionType, TransferMovementDraft } from "../dtos/TransactionPageState";
import type { SaveTransferFormRequestDto } from "../dtos/TransactionDto";
import { TransferForm } from "./TransferForm";
import { useSettings } from "../../settings/provider/SettingProvider";

type Props = {
  editingMovement?: TransferMovementDraft | null;
  isOpen: boolean;
  onClose: () => void;
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  isAutoTagging?: boolean;
  onAutoTag?: (description: string, existingTags: string[], transactionType: TransactionType) => Promise<string[]>;
  onSave: (payload: SaveTransferFormRequestDto) => Promise<void>;
};

export function TransferFormDrawer({
  editingMovement,
  isOpen,
  onClose,
  counterparties,
  currencies,
  isAutoTagging = false,
  onAutoTag,
  onSave,
}: Props) {
  const { t } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <DrawerPanel
      isOpen={isOpen}
      onClose={onClose}
      title={editingMovement == null ? t("transactions.createTransfer") : t("transactions.editTransfer")}
      width="wide"
    >
      <TransferForm
        key={`${isOpen ? "open" : "closed"}-${editingMovement?.id ?? "new"}`}
        counterparties={counterparties}
        currencies={currencies}
        isAutoTagging={isAutoTagging}
        isSubmitting={isSubmitting}
        onAutoTag={onAutoTag}
        onCompleted={onClose}
        movementInitialValue={editingMovement == null ? null : {
          amount: editingMovement.amount,
          counterpartyId: editingMovement.counterpartyId,
          currencyId: editingMovement.currencyId,
          description: editingMovement.description,
          dueDate: editingMovement.dueDate,
          id: editingMovement.id,
          status: editingMovement.status,
          tags: editingMovement.tags,
          transactionDate: editingMovement.transactionDate,
          transferType: editingMovement.transferType,
        }}
        movementInitialDetails={editingMovement?.details ?? []}
        movementInitialTransactionItems={editingMovement?.transactionItems ?? []}
        movementSubmitLabel={t("transactions.save")}
        onSave={async payload => {
          setIsSubmitting(true);
          try {
            await onSave(payload);
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    </DrawerPanel>
  );
}
