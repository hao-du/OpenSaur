# Offline Mode (Frontend)

## Overview
Captures transactions locally (IndexedDB) when offline and syncs to server on reconnection.

## IndexedDB Stores
- `OfflineTransactionsStore` — `OfflineTransactionRecord` objects
- `OfflineMetadataStore` — Sync metadata/config
- `OfflineTemplatesStore` — User-defined form templates

## Data Flow

### A. Capture (Offline)
1. User creates transaction (e.g., via `CashFlowFormDrawer`).
2. `offlineTransactionFormUtils.ts` builds `OfflineTransactionRecord` with serialized `payloadJson`.
3. Saved to `OfflineTransactionsStore`.

### B. Sync (Online)
1. `isOfflineMode()` / network events trigger sync.
2. Records read from store, replayed as API calls (e.g., `POST /api/transactions/cashflows/create`).
3. Success → record removed. Error → marked for retry/resolution.

### C. Templates
- `build...InitialValue` functions use template data + current date to reconstruct form state offline.

## Auth: Redirect-to-Auth Workflow
When unauthenticated users trigger protected actions (Import Metadata, Submit Review):
1. Component checks `authSession` → if missing, navigate to `/prepare-session` with `returnTo` state.
2. User authenticates via OIDC → callback → redirect back to original page with query params.
3. Page auto-executes the requested action (e.g., `importMetadata=1`).

## Management Actions
1. **Import Metadata** — Fetches latest currencies/banks/counterparties/tags from server → refreshes `OfflineMetadataStore`. Requires auth.
2. **Submit for Review** — Pushes all local transactions to server for processing into ledger. Requires auth + ≥1 local record.

## Debugging
- **IndexedDB**: DevTools → Application → IndexedDB
- **Simulate offline**: DevTools Network "Offline" toggle, or hostname starting with `off.`
- **Sync errors**: Check `OfflineTransactionsPage` UI status display
- **Console**: Watch for `OfflineTransactionRecord` parsing / `payloadJson` errors
