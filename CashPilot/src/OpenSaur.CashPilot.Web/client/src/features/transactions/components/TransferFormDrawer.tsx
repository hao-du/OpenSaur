import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { TransferLookupDto } from "../dtos/TransactionDto";
import { TransferForm } from "./TransferForm";

type Props = {
  editingMovement?: {
    id: string;
    transferId: string;
    currencyId: string;
    amount: number;
    direction: number;
    transactionDate: string;
    description?: string | null;
    isActive: boolean;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  transfers: TransferLookupDto[];
  onCreateTransfer: (payload: {
    counterpartyId: string;
    transferType: number;
    currencyId: string;
    amount: number;
    transactionDate: string;
    dueDate?: string;
    description?: string;
  }) => Promise<void>;
  onAddTransferTransaction: (payload: {
    transferId: string;
    currencyId: string;
    amount: number;
    direction: number;
    transactionDate: string;
    description?: string;
  }) => Promise<void>;
  onUpdateTransferTransaction?: (id: string, payload: {
    transferId: string;
    currencyId: string;
    amount: number;
    direction: number;
    transactionDate: string;
    description?: string;
    isActive: boolean;
  }) => Promise<void>;
};

export function TransferFormDrawer({ editingMovement, isOpen, onClose, counterparties, currencies, transfers, onCreateTransfer, onAddTransferTransaction, onUpdateTransferTransaction }: Props) {
  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title={editingMovement == null ? "Transfer (Master/Detail)" : "Edit Transfer Movement"} width="wide">
      <TransferForm
        counterparties={counterparties}
        currencies={currencies}
        movementInitialValue={editingMovement == null ? null : editingMovement}
        movementSubmitLabel={editingMovement == null ? "Add Transaction" : "Save Transaction"}
        onAddTransferTransaction={payload => editingMovement != null && onUpdateTransferTransaction != null
          ? onUpdateTransferTransaction(editingMovement.id, { ...payload, isActive: editingMovement.isActive })
          : onAddTransferTransaction(payload)}
        onCreateTransfer={onCreateTransfer}
        transfers={transfers}
      />
    </DrawerPanel>
  );
}
