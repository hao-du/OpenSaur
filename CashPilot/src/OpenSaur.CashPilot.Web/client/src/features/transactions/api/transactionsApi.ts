import { client } from "../../../infrastructure/http/client";
import type {
  AddBankAccountTransactionRequestDto,
  AddTransferTransactionRequestDto,
  CreateBankAccountRequestDto,
  CreateCashFlowRequestDto,
  CreateCurrencyExchangeRequestDto,
  CreateTransferRequestDto,
  TransactionDashboardDto,
  TransactionListItemDto
} from "../dtos/TransactionDto";

export async function getTransactions() {
  return client.get<TransactionListItemDto[]>("/api/transactions");
}

export async function getTransactionDashboard() {
  return client.get<TransactionDashboardDto>("/api/transactions/dashboard");
}

export async function createCashFlow(request: CreateCashFlowRequestDto) {
  return client.post<string, CreateCashFlowRequestDto>("/api/transactions/cashflows", request);
}

export async function createBankAccount(request: CreateBankAccountRequestDto) {
  return client.post<string, CreateBankAccountRequestDto>("/api/transactions/bankaccounts", request);
}

export async function addBankAccountTransaction(request: AddBankAccountTransactionRequestDto) {
  return client.post<string, AddBankAccountTransactionRequestDto>("/api/transactions/bankaccounts/transactions", request);
}

export async function createTransfer(request: CreateTransferRequestDto) {
  return client.post<string, CreateTransferRequestDto>("/api/transactions/transfers", request);
}

export async function addTransferTransaction(request: AddTransferTransactionRequestDto) {
  return client.post<string, AddTransferTransactionRequestDto>("/api/transactions/transfers/transactions", request);
}

export async function createCurrencyExchange(request: CreateCurrencyExchangeRequestDto) {
  return client.post<string, CreateCurrencyExchangeRequestDto>("/api/transactions/exchanges", request);
}
