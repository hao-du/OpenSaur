export type TransactionDto = {
  id: string;
  amount: number;
  currencyId: string;
  currencyName: string;
  description: string | null;
  isIncome: boolean;
  transactedOn: string;
  type: string;
};

export type UpsertCashFlowRequestDto = {
  amount: number;
  currencyId: string;
  description: string | null;
  isIncome: boolean;
  transactedOn: string;
};
