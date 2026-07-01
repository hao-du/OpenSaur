# Feature Specification: Pending Transactions

This specification covers the workflow for managing transactions that are not yet finalized.

## Business Goal
To provide a "draft" or "staging" area for transactions that need review or synchronization before being committed to the main ledger.

## Workflow

### 1. Staging
- Transactions are created in a "Pending" state.
- These can include cash flows, bank account movements, etc.

### 2. Synchronization/Submission
- Users can review the list of pending transactions.
- **Sync Process**: Users can "Submit" pending transactions, which moves them from the pending state to the actual transaction ledger.

## Acceptance Criteria
- [ ] Users can view all pending transactions.
- [ ] Users can delete pending transactions before they are submitted.
- [ ] A "Sync" action correctly converts pending transactions into permanent ones.
