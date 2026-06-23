import { client } from "../../../infrastructure/http/client";
import type {
  PendingTransactionRecordDto,
  PendingTransactionSubmissionDto,
  PendingTransactionSyncRequestDto,
  PendingTransactionSyncResponseDto,
} from "../dtos/PendingTransactionDto";

export async function getPendingTransactions() {
  return client.get<PendingTransactionSubmissionDto[]>("/api/pending-transactions/get");
}

export async function submitPendingTransactions(transactions: PendingTransactionRecordDto[]) {
  await client.post<void>("/api/pending-transactions/submit", transactions);
}

export async function updatePendingTransaction(id: string, transaction: PendingTransactionRecordDto) {
  await client.put<void>(`/api/pending-transactions/update/${id}`, transaction);
}

export async function deletePendingTransaction(id: string) {
  await client.delete<void>(`/api/pending-transactions/delete/${id}`);
}

export async function syncPendingTransactions(ids: string[]) {
  return client.post<PendingTransactionSyncResponseDto, PendingTransactionSyncRequestDto>(
    "/api/pending-transactions/sync",
    { ids },
  );
}
