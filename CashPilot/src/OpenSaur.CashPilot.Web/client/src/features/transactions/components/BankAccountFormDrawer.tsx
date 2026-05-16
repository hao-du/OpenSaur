import { useState } from "react";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { SaveBankAccountFormRequestDto } from "../dtos/TransactionDto";
import { BankAccountForm } from "./BankAccountForm";

type Props = {
  editingBankAccount?: SaveBankAccountFormRequestDto | null;
  isOpen: boolean;
  onClose: () => void;
  banks: BankDto[];
  currencies: CurrencyDto[];
  onSave: (payload: SaveBankAccountFormRequestDto) => Promise<void>;
};

export function BankAccountFormDrawer({ editingBankAccount, isOpen, onClose, banks, currencies, onSave }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title={editingBankAccount == null ? "Create Bank Account" : "Edit Bank Account"} width="wide">
      <BankAccountForm
        banks={banks}
        currencies={currencies}
        initialValue={editingBankAccount}
        onSubmit={async payload => {
          setIsSubmitting(true);
          try {
            await onSave(payload);
            onClose();
          } finally {
            setIsSubmitting(false);
          }
        }}
        isSubmitting={isSubmitting}
        submitLabel={editingBankAccount == null ? "Create" : "Save"}
      />
    </DrawerPanel>
  );
}
