# Feature Technical Documentation: Pending Transactions (Backend)

This document provides a technical breakdown of the Pending Transactions module in the .NET backend.

## 1. Overview
The Pending Transactions module provides a server-side staging area for financial entries. It is primarily used to store transactions created while the client is in "Offline Mode" (captured as `OfflineTransactionRecord`s) or to hold complex, multi-part transactions (like Transfers or Exchanges) before they are officially committed to the financial ledger.

## 2. Architecture & Component Map

### API Endpoints (`PendingTransactionsEndpoints.cs`)
The API is organized under the `/api/pending-transactions` route group and requires a valid `CanAccessPolicyName` permission.

- **`GET /get`**: Retrieves all pending transactions belonging to the current user.
- **`POST /submit`**: Manually triggers the submission of a single pending transaction into the main ledger.
- **`PUT /update/{id:guid}`**: Updates the details of a pending transaction.
- **`DELETE /delete/{id:guid}`**: Discards a pending transaction.
- **`POST /sync`**: The bulk synchronization endpoint used by the frontend to "replay" a collection of offline-captured transactions.

### Logic Layers

- **Handlers**: Implements the primary business logic for the endpoint routes.
    - `GetPendingTransactionsHandler`: Fetches pending records from the database.
    - `SubmitPendingTransactionsHandler`: Processes the conversion of a single pending item to a permanent transaction.
    - `SyncPendingTransactionsHandler`: Orchestrates the bulk synchronization of multiple transactions.
    - `Update/Delete Handlers`: Manage the lifecycle of the pending entries.

- **Synchronization Engine (`SyncPendingTransactionsHandler`)**: 
    - The core "replay" engine. It iterates through a list of provided IDs, deserializes their JSON payloads, and invokes the appropriate domain handler (e.g., `CreateCashFlowHandler`) to finalize the transaction.

- **Helper Utilities**:
    - `PendingTransactionSyncHelper`: Handles security contexts (User Principals) for the sync process.

## 3. Implementation Detail: The Sync Workflow

The `SyncPendingTransactionsHandler` is responsible for moving data from the "Pending" state to the "Permanent" state.

### The "Replay" Mechanism
Because the backend cannot know the exact type of transaction stored in a generic "Offline" payload without inspection, the sync process uses a **Polymorphic Replay** strategy:

1.  **Identification**: The handler receives a list of `PendingTransactionSyncRequest` IDs.
2.  **Deserialization**: It retrieves the `PendingTransactionSubmission` records. For each record, it deserializes the `PayloadJson` into an `OfflineTransactionRecordDto`.
3.  **Type Dispatching**: The `SyncPendingRowAsync` method uses a `switch` expression on the `record.Type` (e.g., "CashFlow", "Transfer", "Exchange") to determine which domain handler to invoke.
4.  **Handler Re-invocation**: The system calls the *existing* production handlers (e.g., `CreateTransferFormHandler.HandleAsync`). This ensures that all business rules, validations, and side effects (like updating bank balances) are applied exactly as if the transaction had been created online.
5.  **Transactionality**: The process is wrapped in a database transaction. If a row fails to sync (due to validation or logic errors), it is marked as failed, and the loop continues to the next record to maximize successful synchronizations.

## 4. Data Model

### `PendingTransactionSubmission`
This entity acts as a "flight recorder" for client-side actions.
- **`Id`**: Unique identifier for the pending entry.
- **`OwnerId`**: The user who created the transaction.
- **`PayloadJson`**: A serialized JSON representation of the transaction's complete data (DTO).
- **`CreatedOn`**: Timestamp for auditing.

### Transaction Lifecycle
1.  **Staged**: Created in the `PendingTransactionSubmissions` table.
2.  **Finalized**: Moved to the main `Transactions` (or related) tables and removed from `PendingTransactionSubmissions`.
3.  **Discarded**: Removed from `PendingTransactionSubmissions` without being moved to the ledger.

## 5. Debugging & Troubleshooting

- **Sync Failures**: If the `Sync` endpoint returns failures, it is likely due to a **Validation Error** (e.g., a user changed a bank account status while offline, making the transaction invalid now). Check the response for specific error messages from the domain handlers.
- **JSON Incompatibility**: If a sync fails with a deserialization error, it indicates a schema mismatch between the client-side payload and the current backend DTOs.
- **Testing**: To test the sync flow, one can manually insert a JSON payload into the `PendingTransactionSubmissions` table via SQL and then trigger the `/sync` endpoint.
