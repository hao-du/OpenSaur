import type { OfflineTransactionRecord } from "../../offline/storages/offlineTransactionsStore";

export type PendingTransactionRecordDto = OfflineTransactionRecord;

export type PendingTransactionSubmissionDto = {
  createdOn: string;
  id: string;
  payload: PendingTransactionRecordDto;
  updatedOn: string | null;
};

export type PendingTransactionSyncRequestDto = {
  ids: string[];
};

export type PendingTransactionSyncResponseDto = {
  failed: number;
  synced: number;
};
