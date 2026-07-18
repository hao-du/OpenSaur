import type { TransactionListItemDto } from "./TransactionDto";

export type TransactionType = TransactionListItemDto["type"];

export type TransactionDeleteTarget = {
  id: string;
  type: TransactionType;
  description: string | null;
};

export type TransferMovementDraft = {
  id: string;
  counterpartyId: string;
  transferType: number;
  status: number;
  currencyId: string;
  amount: number;
  transactionDate: string;
  dueDate?: string | null;
  description?: string | null;
  tags?: string[] | null;
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
  transactionItems: Array<{ id?: string; name: string; amount: number }>;
};

export type ExchangeDraft = {
  id: string;
  exchangeRate: number | null;
  exchangeDate: string;
  outCurrencyId: string;
  outAmount: number;
  inCurrencyId: string;
  inAmount: number;
  description?: string | null;
  tags?: string[] | null;
  isActive: boolean;
  transactionItems?: Array<{ id?: string; name: string; amount: number }>;
};
