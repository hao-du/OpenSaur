export const transactionDirections = {
  inflow: "1",
  outflow: "2",
} as const;

export const transactionDirectionValues = {
  inflow: 1,
  outflow: 2,
} as const;

export const bankAccountTransactionTypes = {
  initialDeposit: 1,
  interestPayment: 2,
  principalReturn: 3,
} as const;

export const bankAccountStatuses = {
  active: 1,
  matured: 2,
  closedEarly: 3,
} as const;

export const transferStatuses = {
  active: 1,
  completed: 2,
  cancelled: 3,
} as const;

export const transferTypes = {
  lend: 1,
  borrow: 2,
  give: 3,
  receive: 4,
} as const;

export const transactionFormTabs = {
  form: "form",
  items: "items",
} as const;

type TranslationFunc = (key: import("../../features/settings/provider/translations").TranslationKey) => string;

export function getTransactionTypeLabel(type: "CashFlow" | "BankAccount" | "Transfer" | "Exchange", t: TranslationFunc) {
  if (type === "CashFlow") return t("transactions.cashFlow");
  if (type === "BankAccount") return t("transactions.bankAccount");
  if (type === "Transfer") return t("transactions.transfer");
  return t("transactions.exchange");
}

export function getTemplateTypeLabel(templateType: number, t: TranslationFunc) {
  if (templateType === 1) return t("templates.templateType.cashFlow");
  if (templateType === 2) return t("templates.templateType.transfer");
  if (templateType === 3) return t("templates.templateType.exchange");
  return t("templates.templateType.bankAccount");
}

export function getBankAccountTransactionTypeLabel(type: number | null | undefined, t: TranslationFunc) {
  if (type === bankAccountTransactionTypes.initialDeposit) return t("transactions.initialDeposit");
  if (type === bankAccountTransactionTypes.interestPayment) return t("transactions.interestPayment");
  if (type === bankAccountTransactionTypes.principalReturn) return t("transactions.principalReturn");
  return null;
}

export function getBankAccountStatusLabel(status: number | null | undefined, t: TranslationFunc) {
  if (status === bankAccountStatuses.active) return t("transactions.statusType.active");
  if (status === bankAccountStatuses.matured) return t("transactions.statusType.matured");
  if (status === bankAccountStatuses.closedEarly) return t("transactions.statusType.closedEarly");
  return null;
}

export function getTransferStatusLabel(status: number | null | undefined, t: TranslationFunc) {
  if (status === transferStatuses.active) return t("transactions.statusType.active");
  if (status === transferStatuses.completed) return t("transactions.statusType.completed");
  if (status === transferStatuses.cancelled) return t("transactions.statusType.cancelled");
  return null;
}

export function getTransferTypeLabel(type: number | null | undefined, t: TranslationFunc) {
  if (type === transferTypes.lend) return t("transactions.transferType.lend");
  if (type === transferTypes.borrow) return t("transactions.transferType.borrow");
  if (type === transferTypes.give) return t("transactions.transferType.give");
  if (type === transferTypes.receive) return t("transactions.transferType.receive");
  return null;
}
