# Offline Mode

**Goal**: Allow users to draft/manage transactions offline, syncing when connectivity returns.

## Local Storage (IndexedDB)
- `OfflineTransactionsStore` — Draft and pending transactions.
- `OfflineMetadataStore` — Config/metadata for offline operation.
- `OfflineTemplatesStore` — Templates for quick data entry.

## Drafts & Templates
- Users create "Draft" transactions saved locally.
- Templates pre-populate forms (e.g., common transfer details) offline.

## Sync Workflow
1. **Offline**: Actions captured as `OfflineTransactionRecord` (JSON payloads) in IndexedDB.
2. **Online**: Background sync detects connectivity, iterates records, pushes to server API.
   - **Success**: Local record removed/marked synced.
   - **Conflict**: Flagged for manual review or discarded.

## UX
- Visual indicators for "Offline Mode".
- Seamless form interaction during offline periods.

## Acceptance Criteria
- [ ] Offline transactions sync on reconnection.
- [ ] Data integrity maintained (no duplicates/corruption).
- [ ] Templates work offline.
