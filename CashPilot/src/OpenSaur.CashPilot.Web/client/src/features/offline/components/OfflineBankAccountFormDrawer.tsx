import { useState } from "react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import { useSettings } from "../../settings/provider/SettingProvider";
import { BankAccountForm } from "../../transactions/components/BankAccountForm";
import type { SaveBankAccountFormRequestDto } from "../../transactions/dtos/TransactionDto";
import { bankAccountTransactionTypes } from "../../../infrastructure/constants/transactionEnums";
import type { OfflineTransactionRecord } from "../storages/offlineTransactionsStore";
import type { TemplateData } from "../../templates/dtos/TemplateDto";
import { buildBankAccountInitialValue } from "../services/offlineTransactionFormUtils";

type Props = {
  banks: BankDto[];
  currencies: CurrencyDto[];
  editingTransaction?: OfflineTransactionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<OfflineTransactionRecord, "updatedAt">) => void;
  templateData?: TemplateData | null;
};

export function OfflineBankAccountFormDrawer({
  banks,
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
  const initialValue: SaveBankAccountFormRequestDto | null = buildBankAccountInitialValue(templateData, banks, currencies, todayIsoDate, editingTransaction);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingTransaction == null ? t("transactions.createBankAccount") : t("transactions.editBankAccount")}
      width="wide"
    >
      <DrawerHeader />
      <DrawerBody>
        <BankAccountForm
          key={`${isOpen ? "open" : "closed"}-${editingTransaction?.id ?? "new"}`}
          banks={banks}
          currencies={currencies}
          formId="offline-bank-account-form"
          initialValue={initialValue}
          isSubmitting={isSubmitting}
          onSubmit={async (payload) => {
            setIsSubmitting(true);
            try {
              const id = payload.id ?? editingTransaction?.id ?? crypto.randomUUID();
              const bankName = banks.find((item) => item.id === payload.bankId)?.shortName ?? null;
              const currencyCode = currencies.find((item) => item.id === payload.currencyId)?.shortName ?? payload.currencyId;
              const direction = payload.details[0]?.direction ?? null;
              const record: Omit<OfflineTransactionRecord, "updatedAt"> = {
                amount: payload.amount,
                bankAccountStatus: payload.status,
                bankAccountTransactionType: payload.details[0]?.transactionType ?? bankAccountTransactionTypes.initialDeposit,
                bankName,
                counterpartyName: null,
                direction,
                currencyCode,
                description: payload.description ?? "",
                exchangeId: null,
                id,
                isActive: payload.isActive,
                payloadJson: JSON.stringify({ ...payload, id }),
                tags: payload.tags ?? [],
                transactionDate: payload.startDate,
                transferId: null,
                transferStatus: null,
                transferType: null,
                type: "BankAccount",
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
          <ActionButton key="submit" disabled={isBusy} form="offline-bank-account-form" type="submit">
            {isBusy ? t("action.working") : editingTransaction == null ? t("transactions.create") : t("transactions.save")}
          </ActionButton>,
        ]}
      />
    </Drawer>
  );
}
