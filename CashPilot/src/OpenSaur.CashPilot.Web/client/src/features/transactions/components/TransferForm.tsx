import { Stack } from "@mui/material";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { TransferLookupDto } from "../dtos/TransactionDto";
import { TransferHeaderForm } from "./TransferHeaderForm";
import { TransferMovementForm } from "./TransferMovementForm";

type Props = {
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
  movementInitialValue?: {
    transferId: string;
    currencyId: string;
    amount: number;
    direction: number;
    transactionDate: string;
    description?: string | null;
  } | null;
  movementSubmitLabel?: string;
};

export function TransferForm({ counterparties, currencies, transfers, onCreateTransfer, onAddTransferTransaction, movementInitialValue, movementSubmitLabel }: Props) {
  return (
    <Stack spacing={2}>
      <TransferHeaderForm counterparties={counterparties} currencies={currencies} onSubmit={onCreateTransfer} />
      <TransferMovementForm
        currencies={currencies}
        initialValue={movementInitialValue}
        onSubmit={onAddTransferTransaction}
        submitLabel={movementSubmitLabel}
        transfers={transfers}
      />
    </Stack>
  );
}
