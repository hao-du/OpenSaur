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
