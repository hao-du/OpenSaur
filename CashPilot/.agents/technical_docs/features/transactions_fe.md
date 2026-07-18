# Transactions (Frontend)

## Overview
Complex dashboard for viewing, filtering, creating, editing, and deleting all transaction types. Integrates Banks, Counterparties, Currencies with Auto-tagging and Filtering.

## Components

### `TransactionsPage.tsx` (Orchestrator)
**State**: Modal/Drawer visibility, editing state per type, filter criteria, pagination.

### UI Hierarchy
- `DefaultLayout` → Header (`CreateMenu` + `FilterDrawer`) → Grid (`TransactionListPanel` + `TransactionDashboardPanel`) → Form Drawers (CashFlow, BankAccount, Transfer, Exchange) → `ConfirmModal` (deletion).

### Data Layer
- **Queries**: `useTransactionsQuery` (filtered list), `useTransactionDashboardQuery` (summary).
- **Mutations**: `useCreate/Update{CashFlow|BankAccount|Transfer|CurrencyExchange}Mutation`, `useDeleteTransactionMutation`.
- **API**: `transactionsApi.ts` (raw HTTP layer).

## Workflows

### Edit (Polymorphic Loading)
1. Identify type → fetch via specialized endpoint (e.g., `getTransferFormById`).
2. Map response → editing state for corresponding Drawer.
3. Open Drawer with pre-populated data.

### Create (Menu-Driven)
User clicks Create → selects type → Drawer opens with default state.

### Auto-Tagging
Trigger from form → `autoTagMutation` → form's tags updated with suggestions for review.

## Key Details
- **Polymorphic List**: `TransactionListPanel` uses `type` field from `TransactionListItemDto` for icon/label rendering.
- **Dashboard**: `TransactionDashboardPanel` filters by default currency and aggregates income/outcome data.

## Debugging
- **Form errors**: Check `onUpdate`/`onSubmit` props; backend errors shown in top-level `Alert`.
- **Filtering/Pagination**: Inspect `filters` state in `TransactionsPage`.
- **Data issues**: Check `TransferMovementDraft` mapping in `handleEdit`.
- **API**: Network tab for `transactionsApi.ts` calls.
