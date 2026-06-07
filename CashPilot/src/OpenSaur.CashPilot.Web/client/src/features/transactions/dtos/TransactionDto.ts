export type TransactionListItemDto = {
  id: string;
  bankAccountId: string | null;
  transferId: string | null;
  exchangeId: string | null;
  bankName: string | null;
  bankAccountStatus: number | null;
  bankAccountTransactionType: number | null;
  counterpartyName: string | null;
  transferStatus: number | null;
  transferType: number | null;
  type: "CashFlow" | "BankAccount" | "Transfer" | "Exchange";
  description: string | null;
  tags?: string[] | null;
  currencyCode: string;
  amount: number;
  direction: number;
  transactionDate: string;
  isActive: boolean;
};

export type CreateCashFlowRequestDto = {
  currencyId: string;
  amount: number;
  direction: number;
  transactionDate: string;
  description?: string;
  tags: string[];
  transactionItems: TransactionItemDto[];
};

export type SaveBankAccountDetailRequestDto = {
  id?: string;
  currencyId: string;
  amount: number;
  direction: number;
  transactionType: number;
  transactionDate: string;
  description?: string;
  tags?: string;
  isActive: boolean;
};

export type SaveBankAccountFormRequestDto = {
  id?: string;
  bankId: string;
  currencyId: string;
  amount: number;
  interestRate?: number;
  startDate: string;
  maturityDate?: string;
  status: number;
  accountNumber?: string;
  description?: string;
  tags?: string[] | null;
  isActive: boolean;
  details: SaveBankAccountDetailRequestDto[];
  transactionItems: TransactionItemDto[];
};

export type SaveTransferDetailRequestDto = {
  id?: string;
  currencyId: string;
  amount: number;
  direction: number;
  transactionDate: string;
  description?: string;
  tags?: string;
  isActive: boolean;
};

export type SaveTransferFormRequestDto = {
  id?: string;
  counterpartyId: string;
  transferType: number;
  status: number;
  currencyId: string;
  amount: number;
  transactionDate: string;
  dueDate?: string;
  description?: string;
  tags?: string[] | null;
  isActive: boolean;
  details: SaveTransferDetailRequestDto[];
  transactionItems: TransactionItemDto[];
};

export type CreateCurrencyExchangeRequestDto = {
  exchangeRate?: number;
  exchangeDate: string;
  outLeg: { currencyId: string; amount: number; description?: string };
  inLeg: { currencyId: string; amount: number; description?: string };
  description?: string;
  tags: string[];
  transactionItems: TransactionItemDto[];
};
export type UpdateCurrencyExchangeRequestDto = CreateCurrencyExchangeRequestDto & { isActive: boolean };
export type UpdateCashFlowRequestDto = CreateCashFlowRequestDto & { id: string; isActive: boolean };

export type CurrencyBalanceDto = {
  currencyCode: string;
  total: number;
};

export type BankBalanceDto = {
  bankName: string;
  currencyCode: string;
  totalDeposited: number;
};

export type IncomeOutcomeDto = {
  year: number;
  month: number;
  currencyCode: string;
  income: number;
  outcome: number;
};

export type TransactionDashboardDto = {
  currencyBalances: CurrencyBalanceDto[];
  activeBankBalances: BankBalanceDto[];
  incomeOutcomes: IncomeOutcomeDto[];
};

export type DailyInOutCalendarItemDto = {
  day: number;
  income: number;
  outcome: number;
};

export type DailyInOutCalendarDto = {
  year: number;
  month: number;
  currencyCode: string | null;
  items: DailyInOutCalendarItemDto[];
};

export type BankAccountLookupDto = {
  id: string;
  bankShortName: string;
  accountNumber: string | null;
  currencyCode: string;
  status: string;
  amount: number;
};

export type TransferLookupDto = {
  id: string;
  counterpartyName: string;
  transferType: string;
  currencyCode: string;
  status: string;
  amount: number;
  remainingAmount: number;
};

export type CashFlowDetailDto = {
  id: string;
  currencyId: string;
  amount: number;
  direction: number;
  transactionDate: string;
  description: string | null;
  isActive: boolean;
  tags?: string[] | null;
  transactionItems: TransactionItemDto[];
};

export type TransactionItemDto = {
  id?: string;
  name: string;
  amount: number;
};

export type BankAccountTransactionDetailDto = {
  id: string;
  bankAccountId: string;
  currencyId: string;
  amount: number;
  direction: number;
  transactionType: number;
  transactionDate: string;
  description: string | null;
  isActive: boolean;
  tags?: string | null;
};

export type TransferFormDetailDto = {
  id: string;
  currencyId: string;
  amount: number;
  direction: number;
  transactionDate: string;
  description: string | null;
  isActive: boolean;
  tags?: string | null;
};

export type TransferFormDto = {
  id: string;
  counterpartyId: string;
  transferType: number;
  status: number;
  currencyId: string;
  amount: number;
  transactionDate: string;
  dueDate: string | null;
  description: string | null;
  tags?: string[] | null;
  isActive: boolean;
  details: TransferFormDetailDto[];
  transactionItems: TransactionItemDto[];
};

export type CurrencyExchangeDetailDto = {
  id: string;
  exchangeRate: number | null;
  exchangeDate: string;
  outLeg: { currencyId: string; amount: number; description: string | null };
  inLeg: { currencyId: string; amount: number; description: string | null };
  description: string | null;
  tags?: string[] | null;
  isActive: boolean;
  transactionItems: TransactionItemDto[];
};
