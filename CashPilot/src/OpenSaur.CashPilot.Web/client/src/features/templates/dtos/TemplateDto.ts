export type TemplateType = "CashFlow" | "Transfer" | "Exchange" | "BankAccount";

export type TemplateFieldValue<T> = {
  autoPopulate: boolean;
  showUi: boolean;
  value: T;
};

export type CashFlowTemplateData = {
  amount: TemplateFieldValue<string>;
  currencyId: TemplateFieldValue<string>;
  direction: TemplateFieldValue<string>;
  transactionDate: TemplateFieldValue<string>;
  description: TemplateFieldValue<string>;
};

export type TransferTemplateData = {
  counterpartyId: TemplateFieldValue<string>;
  transferType: TemplateFieldValue<string>;
  status: TemplateFieldValue<string>;
  amount: TemplateFieldValue<string>;
  currencyId: TemplateFieldValue<string>;
  direction: TemplateFieldValue<string>;
  transactionDate: TemplateFieldValue<string>;
  dueDate: TemplateFieldValue<string>;
  description: TemplateFieldValue<string>;
  details: TransferTemplateDetailData[];
};

export type TransferTemplateDetailData = {
  amount: TemplateFieldValue<string>;
  direction: TemplateFieldValue<string>;
  transactionDate: TemplateFieldValue<string>;
  description: TemplateFieldValue<string>;
};

export type ExchangeTemplateData = {
  exchangeRate: TemplateFieldValue<string>;
  exchangeDate: TemplateFieldValue<string>;
  outAmount: TemplateFieldValue<string>;
  outCurrencyId: TemplateFieldValue<string>;
  inAmount: TemplateFieldValue<string>;
  inCurrencyId: TemplateFieldValue<string>;
  description: TemplateFieldValue<string>;
};

export type BankAccountTemplateData = {
  bankId: TemplateFieldValue<string>;
  accountNumber: TemplateFieldValue<string>;
  status: TemplateFieldValue<string>;
  amount: TemplateFieldValue<string>;
  currencyId: TemplateFieldValue<string>;
  interestRate: TemplateFieldValue<string>;
  startDate: TemplateFieldValue<string>;
  maturityDate: TemplateFieldValue<string>;
  description: TemplateFieldValue<string>;
  details: BankAccountTemplateDetailData[];
};

export type BankAccountTemplateDetailData = {
  amount: TemplateFieldValue<string>;
  direction: TemplateFieldValue<string>;
  transactionDate: TemplateFieldValue<string>;
  description: TemplateFieldValue<string>;
};

export type TemplateData = CashFlowTemplateData | TransferTemplateData | ExchangeTemplateData | BankAccountTemplateData;

export type TemplateListItemDto = {
  id: string;
  name: string;
  description: string | null;
  templateType: number;
  isActive: boolean;
};

export type TemplateDetailDto = {
  id: string;
  name: string;
  description: string | null;
  templateType: number;
  templateDataJson: string;
  isActive: boolean;
};

export type UpsertTemplateRequestDto = {
  name: string;
  description: string | null;
  templateType: number;
  templateDataJson: string;
  isActive?: boolean;
};

export type TemplateFilterParams = {
  isActive: boolean;
  name: string;
  templateType: "" | TemplateType;
};
