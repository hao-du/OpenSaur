# Feature Technical Documentation: Pending Transactions (Frontend)

This document details the technical implementation of the "Pending Transactions" feature, which serves as a staging area for unfinalized financial entries.

## 1. Overview
Pending Transactions provide a "draft" workflow. Users can create transactions that are not yet part of the official ledger. This is used for two primary purposes:
1.  **Staging**: To prepare complex transactions (like Transfers or Exchanges) before final submission.
2.  **Review**: To allow users to review a batch of entries before they impact the main financial statements.

## 2. Architecture & Component Map

### Main Component: `PendingTransactionsPage.tsx`
The landing page for managing all staged (pending) items.

**Key Logic:**
- **Status Management**: The page lists transactions that are in a "Pending" state.
- **Review & Sync**: Provides the interface to "Submit" (Synchronize) these transactions to the permanent ledger.
- **Deletion**: Allows users to discard pending transactions without affecting the main ledger.

### Data & API Layer
- **`pendingTransactionsApi.ts`**: Handles communication with the backend for fetching, submitting, and deleting pending transactions.
- **`usePendingTransactionsQuery.ts`**: A custom TanStack Query hook that retrieves the list of pending transactions for the current user.
- **`PendingTransactionDto.ts`**: Defines the data structure for pending items, which often mirrors the structure of a "Draft" or "Template".

### Component Hierarchy
- `DefaultLayout`: Standard page layout.
- **Transaction List**: A list view of pending items (similar to the main transaction list).
- **Sync Action**: A primary action button that triggers the bulk submission of all pending items to the server.
- **Deletion Confirmation**: A modal to confirm the permanent removal of a staged transaction.

## 3. Implementation Detail: The Sync Workflow

The "Sync" process is the most critical part of this feature:

1.  **Trigger**: The user initiates a "Sync" or "Submit" action from the `PendingTransactionsPage`.
2.  **Request**: The frontend sends a request to the `POST /api/transactions/pending/sync` endpoint.
3.  **Backend Processing (Summary)**: 
    - The backend iterates through all pending transactions for the user.
    - It converts each pending entry into a permanent transaction (e.g., a `PendingTransfer` becomes a `Transfer`).
    - It ensures all business rules (Amount > 0, valid IDs) are met at the time of conversion.
4.  **Success/Failure**:
    - **All Success**: The server clears the pending queue and returns a success response. The frontend refreshes the list.
    - **Partial Failure**: The server returns which transactions succeeded and which failed (due to validation errors or business rule violations). The frontend updates the list to show error states for failed items.

## 4. Key Implementation Details

### Draft vs. Permanent State
Unlike "Offline" transactions (which are local-only), "Pending" transactions are **server-side**. They exist in the database but are flagged with a status (e.g., `Status = Pending`) to exclude them from standard financial reports and dashboard summaries until they are "finalized".

### Polymorphic Data Handling
Since pending transactions can be of any type (CashFlow, Bank, Transfer, Exchange), the UI must dynamically render the appropriate form or summary based on the `TransactionType` property of the pending item.

## 5. Debugging & Troubleshooting

- **Sync Failures**: If a sync fails, check the `TransactionStatus` in the API response. The server often provides specific reasons why a transaction was rejected during the conversion (e.g., "Account is closed").
- **Missing Items**: If a transaction is "missing", ensure it hasn't already been synchronized or deleted.
- **Inspecting API Calls**: Use the Network tab to monitor the `POST /sync` call and inspect the response payload for granular error messages.
