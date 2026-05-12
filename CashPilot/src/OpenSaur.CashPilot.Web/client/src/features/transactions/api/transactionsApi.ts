import { client } from "../../../infrastructure/http/client";
import type {
  AddBankAccountTransactionRequestDto,
  AddTransferTransactionRequestDto,
  BankAccountTransactionDetailDto,
  SaveBankAccountFormRequestDto,
  CashFlowDetailDto,
  BankAccountLookupDto,
  CreateBankAccountRequestDto,
  CreateCashFlowRequestDto,
  CurrencyExchangeDetailDto,
  CreateCurrencyExchangeRequestDto,
  CreateTransferRequestDto,
  TransferTransactionDetailDto,
  TransactionDashboardDto,
  TransactionListItemDto,
  TransferLookupDto,
  UpdateCurrencyExchangeRequestDto
} from "../dtos/TransactionDto";

export async function getTransactions() {
  return client.get<TransactionListItemDto[]>("/api/transactions");
}

export async function getTransactionDashboard() {
  return client.get<TransactionDashboardDto>("/api/transactions/dashboard");
}

export async function getBankAccounts() {
  return client.get<BankAccountLookupDto[]>("/api/transactions/bankaccounts");
}
export async function getBankAccountFormById(id: string) {
  return client.get<SaveBankAccountFormRequestDto>(`/api/transactions/bankaccounts/${id}/form`);
}

export async function getTransfers() {
  return client.get<TransferLookupDto[]>("/api/transactions/transfers");
}

export async function createCashFlow(request: CreateCashFlowRequestDto) {
  return client.post<string, CreateCashFlowRequestDto>("/api/transactions/cashflows", request);
}
export async function getCashFlowById(id: string) {
  return client.get<CashFlowDetailDto>(`/api/transactions/cashflows/${id}`);
}

export async function updateCashFlow(id: string, request: CreateCashFlowRequestDto & { isActive: boolean }) {
  return client.put<string, CreateCashFlowRequestDto & { isActive: boolean }>(`/api/transactions/cashflows/${id}`, request);
}

export async function createBankAccount(request: CreateBankAccountRequestDto) {
  return client.post<string, CreateBankAccountRequestDto>("/api/transactions/bankaccounts", request);
}
export async function saveBankAccountForm(request: SaveBankAccountFormRequestDto) {
  return client.post<string, SaveBankAccountFormRequestDto>("/api/transactions/bankaccounts/save", request);
}

export async function updateBankAccount(id: string, request: CreateBankAccountRequestDto & { status: number; isActive: boolean }) {
  return client.put<string, CreateBankAccountRequestDto & { status: number; isActive: boolean }>(`/api/transactions/bankaccounts/${id}`, request);
}

export async function addBankAccountTransaction(request: AddBankAccountTransactionRequestDto) {
  return client.post<string, AddBankAccountTransactionRequestDto>("/api/transactions/bankaccounts/transactions", request);
}
export async function getBankAccountTransactionById(id: string) {
  return client.get<BankAccountTransactionDetailDto>(`/api/transactions/bankaccounts/transactions/${id}`);
}

export async function updateBankAccountTransaction(id: string, request: AddBankAccountTransactionRequestDto & { isActive: boolean }) {
  return client.put<string, AddBankAccountTransactionRequestDto & { isActive: boolean }>(`/api/transactions/bankaccounts/transactions/${id}`, request);
}

export async function createTransfer(request: CreateTransferRequestDto) {
  return client.post<string, CreateTransferRequestDto>("/api/transactions/transfers", request);
}

export async function updateTransfer(id: string, request: CreateTransferRequestDto & { status: number; isActive: boolean }) {
  return client.put<string, CreateTransferRequestDto & { status: number; isActive: boolean }>(`/api/transactions/transfers/${id}`, request);
}

export async function addTransferTransaction(request: AddTransferTransactionRequestDto) {
  return client.post<string, AddTransferTransactionRequestDto>("/api/transactions/transfers/transactions", request);
}
export async function getTransferTransactionById(id: string) {
  return client.get<TransferTransactionDetailDto>(`/api/transactions/transfers/transactions/${id}`);
}

export async function updateTransferTransaction(id: string, request: AddTransferTransactionRequestDto & { isActive: boolean }) {
  return client.put<string, AddTransferTransactionRequestDto & { isActive: boolean }>(`/api/transactions/transfers/transactions/${id}`, request);
}

export async function createCurrencyExchange(request: CreateCurrencyExchangeRequestDto) {
  return client.post<string, CreateCurrencyExchangeRequestDto>("/api/transactions/exchanges", request);
}
export async function getCurrencyExchangeById(id: string) {
  return client.get<CurrencyExchangeDetailDto>(`/api/transactions/exchanges/${id}`);
}
export async function updateCurrencyExchange(id: string, request: UpdateCurrencyExchangeRequestDto) {
  return client.put<string, UpdateCurrencyExchangeRequestDto>(`/api/transactions/exchanges/${id}`, request);
}

export async function deleteTransactionByType(type: TransactionListItemDto["type"], id: string) {
  if (type === "CashFlow") {
    await client.delete(`/api/transactions/cashflows/${id}`);
    return;
  }

  if (type === "BankAccount") {
    await client.delete(`/api/transactions/bankaccounts/transactions/${id}`);
    return;
  }

  if (type === "Transfer") {
    await client.delete(`/api/transactions/transfers/transactions/${id}`);
    return;
  }

  await client.delete(`/api/transactions/exchanges/${id}`);
}
