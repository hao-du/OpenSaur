export type TemplateField<T = string> = {
  autoPopulate?: boolean;
  showUi?: boolean;
  value?: T;
};

export type OptionItem = {
  label: string;
  value: string;
};

export type BankAccountTemplateDataShape = {
  bankId?: TemplateField;
  accountNumber?: TemplateField;
  status?: TemplateField;
  amount?: TemplateField;
  currencyId?: TemplateField;
  interestRate?: TemplateField;
  startDate?: TemplateField;
  maturityDate?: TemplateField;
  description?: TemplateField;
  tags?: TemplateField<string[]>;
};

export type BankAccountFormValues = {
  bankId: string;
  accountNumber: string;
  amount: string;
  currencyId: string;
  interestRate: string;
  startDate: string;
  maturityDate: string;
  description: string;
  tags: string[];
  transactionItems: Array<{ id?: string; name: string; amount: string }>;
};

export type CashFlowTemplateDataShape = {
  amount?: TemplateField;
  currencyId?: TemplateField;
  direction?: TemplateField;
  transactionDate?: TemplateField;
  description?: TemplateField;
  tags?: TemplateField<string[]>;
};

export type CashFlowFormValues = {
  amount: string;
  currencyId: string;
  direction: string;
  transactionDate: string;
  description: string;
  tags: string[];
  transactionItems: Array<{ id?: string; name: string; amount: string }>;
};

export type ExchangeTemplateDataShape = {
  exchangeRate?: TemplateField;
  exchangeDate?: TemplateField;
  outAmount?: TemplateField;
  outCurrencyId?: TemplateField;
  inAmount?: TemplateField;
  inCurrencyId?: TemplateField;
  description?: TemplateField;
  tags?: TemplateField<string[]>;
};

export type ExchangeFormValues = {
  exchangeRate: string;
  exchangeDate: string;
  outAmount: string;
  outCurrencyId: string;
  inAmount: string;
  inCurrencyId: string;
  description: string;
  tags: string[];
  transactionItems: Array<{ id?: string; name: string; amount: string }>;
};

export type TransferTemplateDataShape = {
  counterpartyId?: TemplateField;
  transferType?: TemplateField;
  status?: TemplateField;
  amount?: TemplateField;
  currencyId?: TemplateField;
  direction?: TemplateField;
  transactionDate?: TemplateField;
  dueDate?: TemplateField;
  description?: TemplateField;
  tags?: TemplateField<string[]>;
};

export type TransferFormValues = {
  counterpartyId: string;
  transferType: string;
  status: string;
  amount: string;
  currencyId: string;
  direction: string;
  transactionDate: string;
  dueDate: string;
  description: string;
  tags: string[];
  transactionItems: Array<{ id?: string; name: string; amount: string }>;
};
