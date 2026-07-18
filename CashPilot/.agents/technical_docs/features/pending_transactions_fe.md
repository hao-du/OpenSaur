# Pending Transactions (Frontend)

## Overview
Draft workflow for staging transactions before committing to ledger. Used for: (1) preparing complex transactions (Transfers/Exchanges), (2) batch review before finalizing.

## Components
- **`PendingTransactionsPage.tsx`**: Lists pending items, provides Submit/Delete actions.
- **`pendingTransactionsApi.ts`**: API communication (fetch, submit, delete).
- **`usePendingTransactionsQuery.ts`**: TanStack Query hook for listing.
- **`PendingTransactionDto.ts`**: Data structure mirroring Draft/Template shape.

## UI Hierarchy
`DefaultLayout` → Transaction List → Sync Action Button → Deletion Confirmation Modal.

## Sync Workflow
1. User triggers "Sync/Submit" from page.
2. Frontend calls `POST /api/transactions/pending/sync`.
3. Backend converts pending → permanent (validating business rules).
4. **All success**: Queue cleared, list refreshed. **Partial failure**: Failed items shown with error states.

## Key Details
- **Server-side**: Unlike offline transactions (local-only), pending items exist in DB with `Status = Pending`, excluded from reports until finalized.
- **Polymorphic rendering**: UI dynamically renders form/summary based on `TransactionType`.

## Debugging
- **Sync failures**: Check `TransactionStatus` in API response for rejection reasons.
- **Missing items**: May already be synced or deleted.
- **API**: Monitor `POST /sync` in Network tab for error payloads.
