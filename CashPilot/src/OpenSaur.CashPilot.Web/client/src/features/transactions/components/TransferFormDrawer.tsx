import { useState } from "react";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { SaveTransferFormRequestDto } from "../dtos/TransactionDto";
import { TransferForm } from "./TransferForm";

type Props = {
  editingMovement?: {
    id: string;
    counterpartyId: string;
    transferType: number;
    currencyId: string;
    amount: number;
    transactionDate: string;
    dueDate?: string | null;
    description?: string | null;
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
  } | null;
  isOpen: boolean;
  onClose: () => void;
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  onSave: (payload: SaveTransferFormRequestDto) => Promise<void>;
};

export function TransferFormDrawer({ editingMovement, isOpen, onClose, counterparties, currencies, onSave }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title={editingMovement == null ? "Transfer (Master/Detail)" : "Edit Transfer Movement"} width="wide">
      <TransferForm
        counterparties={counterparties}
        currencies={currencies}
        headerSubmitLabel="Apply Header"
        isSubmitting={isSubmitting}
        onCompleted={onClose}
        movementInitialValue={editingMovement == null ? null : {
          amount: editingMovement.amount,
          counterpartyId: editingMovement.counterpartyId,
          currencyId: editingMovement.currencyId,
          description: editingMovement.description,
          dueDate: editingMovement.dueDate,
          id: editingMovement.id,
          transactionDate: editingMovement.transactionDate,
          transferType: editingMovement.transferType
        }}
        movementInitialDetails={editingMovement?.details ?? []}
        movementSubmitLabel={editingMovement == null ? "Save" : "Save"}
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
