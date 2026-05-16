import { client } from "../../../infrastructure/http/client";
import type {
  SaveBankAccountFormRequestDto,
  SaveTransferFormRequestDto,
  CashFlowDetailDto,
  CreateCashFlowRequestDto,
  CurrencyExchangeDetailDto,
  CreateCurrencyExchangeRequestDto,
  UpdateCashFlowRequestDto,
  TransactionDashboardDto,
  TransactionListItemDto,
  TransferFormDto,
  UpdateCurrencyExchangeRequestDto
} from "../dtos/TransactionDto";

export async function getTransactions() {
  return client.get<TransactionListItemDto[]>("/api/transactions/get");
}

export async function getTransactionDashboard() {
  return client.get<TransactionDashboardDto>("/api/transactions/dashboard");
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

export async function saveBankAccountForm(request: SaveBankAccountFormRequestDto) {
  if (request.id == null || request.id.trim().length === 0) {
    return client.post<string, SaveBankAccountFormRequestDto>("/api/transactions/bankaccounts/create", request);
  }
  return client.put<string, SaveBankAccountFormRequestDto>("/api/transactions/bankaccounts/update", request);
}
export async function saveTransferForm(request: SaveTransferFormRequestDto) {
  if (request.id == null || request.id.trim().length === 0) {
    return client.post<string, SaveTransferFormRequestDto>("/api/transactions/transfers/create", request);
  }
  return client.put<string, SaveTransferFormRequestDto>("/api/transactions/transfers/update", request);
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
