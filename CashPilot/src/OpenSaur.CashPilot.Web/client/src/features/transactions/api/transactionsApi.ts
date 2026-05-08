import { client } from "../../../infrastructure/http/client";
import type { TransactionDto, UpsertCashFlowRequestDto } from "../dtos/TransactionDto";

export async function getTransactions() {
  return client.get<TransactionDto[]>("/api/transactions");
}

export async function createCashFlow(request: UpsertCashFlowRequestDto) {
  return client.post<TransactionDto, UpsertCashFlowRequestDto>("/api/transactions/cashflows", request);
}

export async function updateCashFlow(id: string, request: UpsertCashFlowRequestDto) {
  return client.put<TransactionDto, UpsertCashFlowRequestDto>(`/api/transactions/cashflows/${id}`, request);
}

export async function deleteCashFlow(id: string) {
  await client.delete<void>(`/api/transactions/cashflows/${id}`);
}
