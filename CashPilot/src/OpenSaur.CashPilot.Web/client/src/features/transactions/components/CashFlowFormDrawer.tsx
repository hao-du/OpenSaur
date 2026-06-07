import { useState } from "react";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { CashFlowDetailDto } from "../dtos/TransactionDto";
import { CashFlowForm } from "./CashFlowForm";

type Props = {
  editingCashFlow?: CashFlowDetailDto | null;
  isOpen: boolean;
  onClose: () => void;
  currencies: CurrencyDto[];
  onSubmit: (payload: {
    amount: number;
    currencyId: string;
    direction: number;
    transactionDate: string;
    description?: string;
    tags: string[];
    transactionItems: Array<{ id?: string; name: string; amount: number }>;
  }) => Promise<void>;
  onUpdate?: (id: string, payload: {
    amount: number;
    currencyId: string;
    description?: string;
    direction: number;
    transactionDate: string;
    tags: string[];
    isActive: boolean;
    transactionItems: Array<{ id?: string; name: string; amount: number }>;
  }) => Promise<void>;
};

export function CashFlowFormDrawer({ editingCashFlow, isOpen, onClose, currencies, onSubmit, onUpdate }: Props) {
  const { t } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <DrawerPanel
      isOpen={isOpen}
      onClose={onClose}
      title={editingCashFlow == null ? t("transactions.createCashFlowTitle") : t("transactions.editCashFlowTitle")}
      width="wide"
    >
      <CashFlowForm
        currencies={currencies}
        initialValue={editingCashFlow}
        isSubmitting={isSubmitting}
        onSubmit={async (payload) => {
          setIsSubmitting(true);
          try {
            if (editingCashFlow != null && onUpdate != null) {
              await onUpdate(editingCashFlow.id, { ...payload, isActive: editingCashFlow.isActive });
            } else {
              await onSubmit(payload);
            }
            onClose();
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    </DrawerPanel>
  );
}
