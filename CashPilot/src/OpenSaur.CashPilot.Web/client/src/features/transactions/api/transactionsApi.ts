import { client } from "../../../infrastructure/http/client";
import type {
  CreateBankAccountFormRequestDto,
  SaveBankAccountFormRequestDto,
  CreateTransferFormRequestDto,
  UpdateTransferFormRequestDto,
  AutoTagRequestDto,
  AutoTagResponseDto,
  CashFlowDetailDto,
  CreateCashFlowRequestDto,
  CurrencyExchangeDetailDto,
  CreateCurrencyExchangeRequestDto,
  DailyInOutCalendarDto,
  UpdateCashFlowRequestDto,
  TransactionDashboardDto,
  TransactionListItemDto,
  TransferFormDto,
  UpdateCurrencyExchangeRequestDto,
  UpdateBankAccountFormRequestDto
} from "../dtos/TransactionDto";

export async function getTransactions() {
  return client.get<TransactionListItemDto[]>("/api/transactions/get");
}

export async function getTransactionDashboard() {
  return client.get<TransactionDashboardDto>("/api/transactions/dashboard");
}

export async function getDailyInOutCalendar(year: number, month: number) {
  return client.get<DailyInOutCalendarDto>(`/api/transactions/dashboard/daily-in-out?year=${year}&month=${month}`);
}

export async function autoTagTransaction(request: AutoTagRequestDto) {
  return client.post<AutoTagResponseDto, AutoTagRequestDto>("/api/transactions/auto-tag", request);
}

export async function getBankAccountFormById(id: string) {
  return client.get<SaveBankAccountFormRequestDto>(`/api/transactions/bankaccounts/getById/${id}`);
}

export async function getTransferFormById(id: string) {
  return client.get<TransferFormDto>(`/api/transactions/transfers/getById/${id}`);
}

export async function createCashFlow(request: CreateCashFlowRequestDto) {
  return client.post<string, CreateCashFlowRequestDto>("/api/transactions/cashflows/create", request);
}
export async function getCashFlowById(id: string) {
  return client.get<CashFlowDetailDto>(`/api/transactions/cashflows/getById/${id}`);
}

export async function updateCashFlow(id: string, request: CreateCashFlowRequestDto & { isActive: boolean }) {
  return client.put<string, UpdateCashFlowRequestDto>("/api/transactions/cashflows/update", { ...request, id });
}

export async function createBankAccountForm(request: CreateBankAccountFormRequestDto) {
  return client.post<string, CreateBankAccountFormRequestDto>("/api/transactions/bankaccounts/create", request);
}

export async function updateBankAccountForm(id: string, request: UpdateBankAccountFormRequestDto) {
  return client.put<string, UpdateBankAccountFormRequestDto>("/api/transactions/bankaccounts/update", { ...request, id });
}
export async function createTransferForm(request: CreateTransferFormRequestDto) {
  return client.post<string, CreateTransferFormRequestDto>("/api/transactions/transfers/create", request);
}

export async function updateTransferForm(id: string, request: UpdateTransferFormRequestDto) {
  return client.put<string, UpdateTransferFormRequestDto>("/api/transactions/transfers/update", { ...request, id });
}

export async function createCurrencyExchange(request: CreateCurrencyExchangeRequestDto) {
  return client.post<string, CreateCurrencyExchangeRequestDto>("/api/transactions/exchanges/create", request);
}
export async function getCurrencyExchangeById(id: string) {
  return client.get<CurrencyExchangeDetailDto>(`/api/transactions/exchanges/getById/${id}`);
}
export async function updateCurrencyExchange(id: string, request: UpdateCurrencyExchangeRequestDto) {
  return client.put<string, UpdateCurrencyExchangeRequestDto & { id: string }>("/api/transactions/exchanges/update", { ...request, id });
}

export async function deleteTransactionByType(type: TransactionListItemDto["type"], id: string) {
  if (type === "CashFlow") {
    await client.delete(`/api/transactions/cashflows/delete?id=${id}`);
    return;
  }

  if (type === "BankAccount") {
    await client.delete(`/api/transactions/bankaccounts/delete?id=${id}`);
    return;
  }

  if (type === "Transfer") {
    await client.delete(`/api/transactions/transfers/delete?id=${id}`);
    return;
  }

  await client.delete(`/api/transactions/exchanges/delete?id=${id}`);
}
