# Feature Technical Documentation: Transactions

This document provides a technical breakdown of the Transactions feature, covering its API structure, business logic implementation, and data flow.

## 1. Overview
The Transactions module is the core engine of CashPilot. It manages all financial movements, categorized into four main types:
- **CashFlow**: Direct money in/out movements.
- **BankAccount Movements**: Transactions specifically associated with a bank account.
- **Transfers**: Money movements between two counterparties.
- **Currency Exchanges**: Swaps between different currencies involving two legs.

## 2. Architecture & Component Map

### API Endpoints (`TransactionsEndpoints.cs`)
The API is organized into functional groups under `/api/transactions`:
- **General**: `/get` (List), `/dashboard` (Summary), `/auto-tag` (Process tags), `/marker-calendar` (Calendar data).
- **CashFlow**: `/cashflows/getById`, `/create`, `/update`, `/delete`.
- **BankAccount**: `/bankaccounts/getById`, `/create`, `/update`, `/delete`.
- **Transfer**: `/transfers/getById`, `/create`, `/update`, `/delete`.
- **Exchange**: `/exchanges/getById`, `/create`, `/update`, `/delete`.

### Logic Layers
- **Handlers**: Implement the core business logic for each operation. They are organized by transaction type (e.g., `Handlers/CashFlow`, `Handlers/Transfer`).
- **Query Providers**: Implemented via `ITransactionQueryProvider`. These handle complex data retrieval and aggregation (e.g., `TransactionQueryProvider`, `CashFlowTransactionQueryProvider`).
- **Services**: Shared business logic.
    - `TransactionAutoTagService`: Manages automatic categorization.
    - `BankAccountMovementManager`: Manages bank-specific movement rules.
- **Validations**: Uses `FluentValidation` to enforce business rules on incoming request models.

### Data Transfer Objects (DTOs)
- `TransactionDtos.cs`: Defines the data shapes for requests and responses.
- `AutoTagDtos.cs`: Used for the auto-tagging process.

## 3. Implementation Detail: Request Flow (Example: Create CashFlow)

1.  **Request**: A client sends a `POST` to `/api/transactions/cashflows/create`.
2.  **Endpoint**: `TransactionsEndpoints.MapPost` routes the request to `CreateCashFlowHandler.HandleAsync`.
3.  **Validation**: `CreateCashFlowRequestValidator` ensures the `Amount > 0` and `Direction` is valid.
4.  **Handler Execution**:
    - The handler receives the `CreateCashFlowRequest`.
    - It uses the `DbContext` to persist the new `Transaction` entity.
    - It may invoke `TransactionAutoTagService` to categorize the transaction.
5.  **Response**: Returns a `200 OK` or `201 Created` with the created transaction details.

## 4. Key Logic & Complex Algorithms

### Auto-Tagging Logic
The `TransactionAutoTagService` scans transaction descriptions/metadata against a set of rules or historical patterns to automatically assign tags.

### Polymorphic Querying
The system uses a polymorphic approach for querying transactions. Different transaction types (Bank, Transfer, Exchange) implement specialized `QueryProviders` that are aggregated into a unified view via `TransactionQueryProvider`.

### Offline Sync Logic
When in offline mode, transactions are stored in `IndexedDB` and later synchronized to the server. The `SyncPendingTransactionsHandler` is responsible for processing these stored records.

## 5. Data Model (Simplified)

- **Transaction**: The central entity containing `Amount`, `CurrencyId`, `Direction`, `TransactionDate`, and `Status`.
- **TransactionLeg/Detail**: Used for complex transactions (Transfers/Exchanges) to represent the two sides of a movement.
- **Counterparty**: An entity involved in transfers.
- **Bank**: Represents the source/destination bank account.

## 6. Debugging & Troubleshooting

- **Common Errors**: 
    - `TransactionValidationException`: Occurs when validation rules (e.g., `Amount > 0`) are violated.
    - `ConcurrencyException`: Occurs when updating a transaction that has been modified elsewhere.
- **Breakpoints**: 
    - Place breakpoints in the `HandleAsync` method of the specific `Handler` to trace business logic.
    - Place breakpoints in `ApplyCommonRules` within `Validators` to debug input validation issues.
- **API Testing**: Use the `MapGroup("/api/transactions")` as the base URL for testing endpoints via tools like Postman or Swagger.
