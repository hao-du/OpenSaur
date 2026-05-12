export type TransactionListItemDto = {
  id: string;
  type: "CashFlow" | "BankAccount" | "Transfer" | "Exchange";
  description: string | null;
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
};

export type CreateBankAccountRequestDto = {
  bankId: string;
  currencyId: string;
  amount: number;
  interestRate: number;
  startDate: string;
  maturityDate: string;
  accountNumber?: string;
  description?: string;
};

export type AddBankAccountTransactionRequestDto = {
  bankAccountId: string;
  currencyId: string;
  amount: number;
  direction: number;
  transactionType: number;
  transactionDate: string;
  description?: string;
};
export type SaveBankAccountDetailRequestDto = {
  id?: string;
  currencyId: string;
  amount: number;
  direction: number;
  transactionType: number;
  transactionDate: string;
  description?: string;
  isActive: boolean;
};

export type SaveBankAccountFormRequestDto = {
  id?: string;
  bankId: string;
  currencyId: string;
  amount: number;
  interestRate: number;
  startDate: string;
  maturityDate: string;
  status: number;
  accountNumber?: string;
  description?: string;
  isActive: boolean;
  details: SaveBankAccountDetailRequestDto[];
};

export type CreateTransferRequestDto = {
  counterpartyId: string;
  transferType: number;
  currencyId: string;
  amount: number;
  transactionDate: string;
  dueDate?: string;
  description?: string;
};

export type AddTransferTransactionRequestDto = {
  transferId: string;
  currencyId: string;
  amount: number;
  direction: number;
  transactionDate: string;
  description?: string;
};

export type CreateCurrencyExchangeRequestDto = {
  exchangeRate: number;
  exchangeDate: string;
  outLeg: { currencyId: string; amount: number; description?: string };
  inLeg: { currencyId: string; amount: number; description?: string };
  description?: string;
};
export type UpdateCurrencyExchangeRequestDto = CreateCurrencyExchangeRequestDto & { isActive: boolean };

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
};

export type TransferTransactionDetailDto = {
  id: string;
  transferId: string;
  currencyId: string;
  amount: number;
  direction: number;
  transactionDate: string;
  description: string | null;
  isActive: boolean;
};

export type CurrencyExchangeDetailDto = {
  id: string;
  exchangeRate: number;
  exchangeDate: string;
  outLeg: { currencyId: string; amount: number; description: string | null };
  inLeg: { currencyId: string; amount: number; description: string | null };
  description: string | null;
  isActive: boolean;
};
