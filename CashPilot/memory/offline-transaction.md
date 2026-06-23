---
name: offline-transaction-system-overview
description: Overview of the pending transaction (offline import) system architecture and current state
metadata:
  type: project
---

**System: Offline Transaction Import**

The project implements an offline transaction import feature that allows importing transactions from external sources via JSON payloads stored in a `PendingTransactionSubmissions` table. The system supports importing 4 transaction types: CashFlow, BankAccount (interest/deposit), Transfer, and Exchange.

**Core Components:**

1. **Database Schema:**
   - `PendingTransactionSubmission`: Stores pending import records with JSON payload
     - `LocalTransactionId`: Unique local ID for the import job
     - `PayloadJson`: The actual transaction data (JSONB column)
     - Audit fields: CreatedBy, UpdatedBy, CreatedOn, UpdatedOn

2. **Handlers:**
   - `GetPendingTransactionsHandler`: Retrieves all pending transactions for a user
   - `SubmitPendingTransactionsHandler`: Submits/imports pending transactions to DB
   - `SyncPendingTransactionsHandler`: Syncs and converts offline records into actual transactions
   - `UpdatePendingTransactionHandler`: Updates a pending transaction record
   - `DeletePendingTransactionHandler`: Deletes a pending transaction record

3. **DTOS:**
   - `OfflineTransactionRecordDto`: The unified record structure with all metadata (Type, Amount, CurrencyCode, etc.)
   - `PendingTransactionRecordResponse`: Response wrapper for pending transaction list
   - `PendingTransactionSyncRequest`: Request with IDs to sync

**Sync Process (`SyncPendingTransactionsHandler`):**
- Validates user auth using `ClaimHelper.GetCurrentUserId`
- Creates a synthetic `ClaimsPrincipal` for the sync operation
- Iterates through pending transactions and deserializes by type:
  - `CashFlow` → `CreateCashFlowHandler`
  - `BankAccount` → `CreateBankAccountFormHandler` (with `IsActive: true`)
  - `Transfer` → `CreateTransferFormHandler`
  - `Exchange` → `CreateCurrencyExchangeHandler`
- Removes successfully synced records from the pending table

**Frontend Routes:**
- `/pending-transactions`: List pending imports
- `/offline/import`: Submit offline transactions
- `/offline/transactions`: Import batch via POST

**Key Files to Understand Fully:**
- `.agent/*.md` (OpenSpec/Superpower skills) - required before any implementation
- All CRUD handlers in `PendingTransactions/Handlers/`
- Transaction DTOs in `Features/Transactions/Dtos/`
- Database migrations in `Infrastructure/Database/Migrations/`
