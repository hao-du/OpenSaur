import { useState } from "react";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import { ExchangeForm } from "./ExchangeForm";

type Props = {
  editingExchange?: {
    id: string;
    exchangeRate: number;
    exchangeDate: string;
    outCurrencyId: string;
    outAmount: number;
    inCurrencyId: string;
    inAmount: number;
    description?: string | null;
    isActive: boolean;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  currencies: CurrencyDto[];
  onSubmit: (payload: {
    exchangeRate: number;
    exchangeDate: string;
    outLeg: { currencyId: string; amount: number; description?: string };
    inLeg: { currencyId: string; amount: number; description?: string };
    description?: string;
  }) => Promise<void>;
  onUpdate?: (id: string, payload: {
    exchangeRate: number;
    exchangeDate: string;
    outLeg: { currencyId: string; amount: number; description?: string };
    inLeg: { currencyId: string; amount: number; description?: string };
    description?: string;
    isActive: boolean;
  }) => Promise<void>;
};

export function ExchangeFormDrawer({ editingExchange, isOpen, onClose, currencies, onSubmit, onUpdate }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title={editingExchange == null ? "Create Exchange" : "Edit Exchange"} width="wide">
      <ExchangeForm
        currencies={currencies}
        initialValue={editingExchange == null ? null : editingExchange}
        isSubmitting={isSubmitting}
        onSubmit={async payload => {
          setIsSubmitting(true);
          try {
            if (editingExchange != null && onUpdate != null) {
              await onUpdate(editingExchange.id, { ...payload, isActive: editingExchange.isActive });
            } else {
              await onSubmit(payload);
            }
            onClose();
          } finally {
            setIsSubmitting(false);
          }
        }}
        submitLabel={editingExchange == null ? "Create Exchange" : "Save Exchange"}
      />
    </DrawerPanel>
  );
}
