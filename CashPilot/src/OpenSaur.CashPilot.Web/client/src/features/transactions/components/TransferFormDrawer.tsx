import { useState } from "react";
import { useMemo } from "react";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { SaveTransferFormRequestDto } from "../dtos/TransactionDto";
import { TransferForm } from "./TransferForm";
import { useSettings } from "../../settings/provider/SettingProvider";

type Props = {
  editingMovement?: {
    id: string;
    counterpartyId: string;
    transferType: number;
    status: number;
    currencyId: string;
    amount: number;
    transactionDate: string;
    dueDate?: string | null;
    description?: string | null;
    tags?: string[] | null;
    isActive: boolean;
    details: Array<{
      id: string;
      currencyId: string;
      amount: number;
      direction: number;
      transactionDate: string;
      description?: string | null;
      isActive: boolean;
    }>;
    transactionItems: Array<{ id?: string; name: string; amount: number }>;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  onSave: (payload: SaveTransferFormRequestDto) => Promise<void>;
};

export function TransferFormDrawer({ editingMovement, isOpen, onClose, counterparties, currencies, onSave }: Props) {
  const { t } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const movementInitialValue = useMemo(() => {
    if (editingMovement == null) {
      return null;
    }

    return {
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
    };
  }, [editingMovement]);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title={editingMovement == null ? t("transactions.createTransfer") : t("transactions.editTransfer")} width="wide">
      <TransferForm
        counterparties={counterparties}
        currencies={currencies}
        isSubmitting={isSubmitting}
        onCompleted={onClose}
        movementInitialValue={movementInitialValue}
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
