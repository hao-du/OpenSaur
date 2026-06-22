import { loadOfflineJson, saveOfflineJson } from "../../../infrastructure/offline/offlineStorage";
import { loadCurrentProfile } from "../../profile/storages/currentProfileStore";

export type OfflineTransactionType = "CashFlow" | "BankAccount" | "Transfer" | "Exchange";

export type OfflineTransactionRecord = {
  amount: number;
  bankAccountStatus?: number | null;
  bankAccountTransactionType?: number | null;
  bankName?: string | null;
  currencyCode: string;
  description: string;
  id: string;
  isActive: boolean;
  userId?: string;
  payloadJson: string;
  counterpartyName?: string | null;
  direction?: number | null;
  transferId?: string | null;
  transferStatus?: number | null;
  transferType?: number | null;
  exchangeId?: string | null;
  tags: string[];
  transactionDate: string;
  type: OfflineTransactionType;
  updatedAt: string;
};

const offlineTransactionsKey = "transactions.list";

export function loadOfflineTransactions() {
  return loadOfflineJson<OfflineTransactionRecord[]>(offlineTransactionsKey) ?? [];
}

export function saveOfflineTransactions(transactions: OfflineTransactionRecord[]) {
  saveOfflineJson(offlineTransactionsKey, transactions);
}

export function upsertOfflineTransaction(record: Omit<OfflineTransactionRecord, "updatedAt">) {
  const currentTransactions = loadOfflineTransactions();
  const nextRecord: OfflineTransactionRecord = {
    ...record,
    userId: record.userId ?? loadCurrentProfile()?.id,
    updatedAt: new Date().toISOString(),
  };

  const existingIndex = currentTransactions.findIndex((item) => item.id === record.id);
  if (existingIndex >= 0) {
    currentTransactions[existingIndex] = nextRecord;
  } else {
    currentTransactions.unshift(nextRecord);
  }

  saveOfflineTransactions(currentTransactions);
}

export function removeOfflineTransaction(id: string) {
  const nextTransactions = loadOfflineTransactions().filter((item) => item.id !== id);
  saveOfflineTransactions(nextTransactions);
}

export function clearOfflineTransactions() {
  saveOfflineTransactions([]);
}
