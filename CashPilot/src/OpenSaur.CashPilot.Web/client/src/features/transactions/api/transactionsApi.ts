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
  UpdateBankAccountFormRequestDto,
  MarkerCalendarDto
} from "../dtos/TransactionDto";
import type { TagDefinitionResponse } from "../../tags/dtos/TagDto";

export async function getTransactions(filter?: { description?: string; fromDate?: string; toDate?: string; showOnlyInitialDeposits?: boolean; types?: string[] }) {
  const params = new URLSearchParams();
  params.set("description", filter?.description ?? "");
  params.set("fromDate", filter?.fromDate ?? "");
  params.set("toDate", filter?.toDate ?? "");
  params.set("showOnlyInitialDeposits", filter?.showOnlyInitialDeposits ? "true" : "false");
  if (filter?.types && filter.types.length > 0) {
    filter.types.forEach(t => params.append("types", t));
  }
  const queryString = params.toString();
  return client.get<TransactionListItemDto[]>(`/api/transactions/get${queryString ? `?${queryString}` : ""}`);
}

export async function getTransactionDashboard() {
  return client.get<TransactionDashboardDto>("/api/transactions/dashboard");
}

export async function getDailyInOutCalendar(year: number, month: number) {
  return client.get<DailyInOutCalendarDto>(`/api/transactions/dashboard/daily-in-out?year=${year}&month=${month}`);
}

export async function getMarkerTags() {
  return client.get<TagDefinitionResponse[]>('/api/transactions/marker-tags');
}

export async function getMarkerCalendar(tagName: string, periodIndex?: number) {
  const params = new URLSearchParams();
  params.set('tagName', tagName);
  if (periodIndex != null) params.set('periodIndex', periodIndex.toString());
  return client.get<MarkerCalendarDto>(`/api/transactions/marker-calendar?${params}`);
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
