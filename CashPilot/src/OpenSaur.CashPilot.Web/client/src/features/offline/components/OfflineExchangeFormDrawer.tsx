import { useState } from "react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import { useSettings } from "../../settings/provider/SettingProvider";
import { ExchangeForm } from "../../transactions/components/ExchangeForm";
import type { OfflineTransactionRecord } from "../storages/offlineTransactionsStore";
import type { TemplateData } from "../../templates/dtos/TemplateDto";
import { buildExchangeInitialValue } from "../services/offlineTransactionFormUtils";
import type { CreateCurrencyExchangeRequestDto } from "../../transactions/dtos/TransactionDto";

type Props = {
  currencies: CurrencyDto[];
  editingTransaction?: OfflineTransactionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<OfflineTransactionRecord, "updatedAt">) => void;
  templateData?: TemplateData | null;
};

export function OfflineExchangeFormDrawer({
  currencies,
  editingTransaction,
  isOpen,
  onClose,
  onSave,
  templateData,
}: Props) {
  const { t, todayIsoDate } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isSubmitting;
  const initialValue = buildExchangeInitialValue(templateData, currencies, todayIsoDate, editingTransaction);
  const recordId = editingTransaction?.id ?? "new";

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingTransaction == null ? t("transactions.createExchange") : t("transactions.editExchange")}
      width="wide"
    >
      <DrawerHeader />
      <DrawerBody>
        <ExchangeForm
          key={`${isOpen ? "open" : "closed"}-${recordId}`}
          currencies={currencies}
          formId="offline-exchange-form"
          initialValue={initialValue}
          isSubmitting={isSubmitting}
          onSubmit={async (payload: CreateCurrencyExchangeRequestDto) => {
            setIsSubmitting(true);
            try {
              const id = editingTransaction?.id ?? crypto.randomUUID();
              const record: Omit<OfflineTransactionRecord, "updatedAt"> = {
                amount: payload.outLeg.amount,
                bankAccountStatus: null,
                bankAccountTransactionType: null,
                bankName: null,
                counterpartyName: null,
                direction: 2,
                currencyCode: currencies.find((item) => item.id === payload.outLeg.currencyId)?.shortName ?? payload.outLeg.currencyId,
                description: payload.description ?? "",
                exchangeId: id,
                id,
                isActive: editingTransaction?.isActive ?? true,
                payloadJson: JSON.stringify(payload),
                tags: payload.tags ?? [],
                transactionDate: payload.exchangeDate,
                transferId: null,
                transferStatus: null,
                transferType: null,
                type: "Exchange",
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
          <ActionButton key="submit" disabled={isBusy} form="offline-exchange-form" type="submit">
            {isBusy ? t("action.working") : editingTransaction == null ? t("transactions.createExchange") : t("transactions.saveExchange")}
          </ActionButton>,
        ]}
      />
    </Drawer>
  );
}
