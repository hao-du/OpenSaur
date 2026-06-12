import { useRef, useState } from "react";
import { WandSparkles } from "lucide-react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import { useSettings } from "../../settings/provider/SettingProvider";
import { CashFlowForm } from "../../transactions/components/CashFlowForm";
import type { CashFlowDetailDto } from "../../transactions/dtos/TransactionDto";
import type { OfflineTransactionRecord } from "../storages/offlineTransactionsStore";
import type { TemplateData } from "../../templates/dtos/TemplateDto";
import { buildCashFlowInitialValue, createOfflineTransactionRecord } from "../services/offlineTransactionFormUtils";

type Props = {
  currencies: CurrencyDto[];
  editingTransaction?: OfflineTransactionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<OfflineTransactionRecord, "updatedAt">) => void;
  templateData?: TemplateData | null;
};

export function OfflineCashFlowFormDrawer({
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
  const initialValue: CashFlowDetailDto | null = buildCashFlowInitialValue(templateData, currencies, todayIsoDate, editingTransaction);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingTransaction == null ? t("transactions.createCashFlowTitle") : t("transactions.editCashFlowTitle")}
      width="wide"
    >
      <DrawerHeader />
      <DrawerBody>
        <CashFlowForm
          key={`${isOpen ? "open" : "closed"}-${editingTransaction?.id ?? "new"}`}
          currencies={currencies}
          formId="offline-cash-flow-form"
          initialValue={initialValue}
          isSubmitting={isSubmitting}
          onAutoTagActionChange={(handler) => {
            autoTagActionRef.current = handler;
          }}
          onSubmit={async (payload) => {
            setIsSubmitting(true);
            try {
              const id = editingTransaction?.id ?? crypto.randomUUID();
              const record = createOfflineTransactionRecord(
                {
                  amount: payload.amount,
                  bankAccountId: null,
                  bankAccountStatus: null,
                  bankAccountTransactionType: null,
                  bankName: null,
                  counterpartyName: null,
                  direction: payload.direction,
                  currencyCode: currencies.find((x) => x.id === payload.currencyId)?.shortName ?? payload.currencyId,
                  description: payload.description ?? "",
                  exchangeId: null,
                  id,
                  isActive: editingTransaction?.isActive ?? true,
                  tags: payload.tags,
                  transactionDate: payload.transactionDate,
                  transferId: null,
                  transferStatus: null,
                  transferType: null,
                  type: "CashFlow",
                },
                JSON.stringify({
                  ...payload,
                  id,
                  isActive: editingTransaction?.isActive ?? true,
                  direction: payload.direction,
                  tags: payload.tags,
                  transactionItems: payload.transactionItems,
                }),
              );
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
          <ActionButton key="submit" disabled={isBusy} form="offline-cash-flow-form" type="submit">
            {isBusy ? t("action.working") : editingTransaction == null ? t("transactions.create") : t("transactions.save")}
          </ActionButton>,
        ]}
      />
    </Drawer>
  );
}
