# Pending Transactions (Backend)

## Overview
Server-side staging for offline-captured transactions or multi-part entries before committing to the ledger.

## API Endpoints (`/api/pending-transactions`, requires `CanAccessPolicyName`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/get` | List current user's pending transactions |
| POST | `/submit` | Submit single pending → permanent ledger |
| PUT | `/update/{id:guid}` | Update pending transaction |
| DELETE | `/delete/{id:guid}` | Discard pending transaction |
| POST | `/sync` | Bulk sync offline-captured transactions |

## Logic Layers
- **Handlers**: `GetPendingTransactionsHandler`, `SubmitPendingTransactionsHandler`, `SyncPendingTransactionsHandler`, Update/Delete handlers.
- **Sync Engine** (`SyncPendingTransactionsHandler`): Deserializes JSON payloads and invokes appropriate domain handlers.
- **Helper**: `PendingTransactionSyncHelper` — manages security contexts for sync.

## Sync: Polymorphic Replay
1. Receives `PendingTransactionSyncRequest` IDs.
2. Deserializes `PayloadJson` → `OfflineTransactionRecordDto`.
3. `SyncPendingRowAsync` dispatches by `record.Type` ("CashFlow", "Transfer", "Exchange") to the matching production handler (e.g., `CreateTransferFormHandler.HandleAsync`).
4. Reuses existing handlers → all business rules/validations apply identically.
5. Wrapped in DB transaction; failed rows marked and skipped.

## Data Model: `PendingTransactionSubmission`
- `Id`, `OwnerId`, `PayloadJson` (serialized DTO), `CreatedOn`.
- **Lifecycle**: Staged → Finalized (moved to main tables) or Discarded (deleted).

## Debugging
- **Sync failures**: Usually validation errors (e.g., account status changed while offline). Check response for domain handler error messages.
- **Deserialization errors**: Schema mismatch between client payload and current backend DTOs.
- **Testing**: Insert JSON payload into `PendingTransactionSubmissions` table, then trigger `/sync`.
