# Transactions (Backend)

## Overview
Core engine managing all financial movements: CashFlow, BankAccount, Transfer, Exchange.

## API Endpoints (`/api/transactions`)
- **General**: `/get`, `/dashboard`, `/auto-tag`, `/marker-calendar`
- **Per type** (CashFlow, BankAccount, Transfer, Exchange): `/getById`, `/create`, `/update`, `/delete`

## Logic Layers
- **Handlers**: Core business logic per type (e.g., `Handlers/CashFlow`, `Handlers/Transfer`).
- **Query Providers**: `ITransactionQueryProvider` implementations for complex/polymorphic data retrieval.
- **Services**: `TransactionAutoTagService` (auto-categorization), `BankAccountMovementManager` (bank rules).
- **Validations**: FluentValidation on request models.
- **DTOs**: `TransactionDtos.cs`, `AutoTagDtos.cs`.

## Request Flow (Example: Create CashFlow)
1. `POST /api/transactions/cashflows/create`
2. `CreateCashFlowRequestValidator` validates (Amount > 0, valid Direction).
3. `CreateCashFlowHandler.HandleAsync` persists entity, optionally invokes `TransactionAutoTagService`.
4. Returns `200/201` with created transaction.

## Key Logic
- **Auto-Tagging**: Scans descriptions/metadata against rules to auto-assign tags.
- **Polymorphic Querying**: Specialized QueryProviders per type, aggregated via `TransactionQueryProvider`.
- **Offline Sync**: Offline records synced via `SyncPendingTransactionsHandler`.

## Data Model
- **Transaction**: `Amount`, `CurrencyId`, `Direction`, `TransactionDate`, `Status`.
- **TransactionLeg/Detail**: Two sides of Transfer/Exchange movements.
- **Counterparty**: Entity in transfers. **Bank**: Source/destination account.

## Debugging
- `TransactionValidationException`: Validation rule violation.
- `ConcurrencyException`: Concurrent modification conflict.
- Breakpoints: `HandleAsync` (handlers), `ApplyCommonRules` (validators).
- API testing base: `MapGroup("/api/transactions")`.
