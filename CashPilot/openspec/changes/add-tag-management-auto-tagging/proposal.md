## Why

CashPilot currently relies on manual categorization, which is slow and inconsistent as transaction volume grows. A dedicated tag system is needed to improve consistency and reporting.

## What Changes

- Add a Tag Management feature to define reusable tags and matching terms.
- Add support to persist `Tags` on BankAccount, CashFlow, Transfer, and Exchange transactions.

## Capabilities

### New Capabilities
- `tag-management`: Manage tag definitions (name, matching terms, active status) used by transaction tagging.

### Modified Capabilities
- None.

## Impact

- Backend domain model and database schema for tags and transaction tag fields.
- Transaction application services and command handlers for create/edit flows.
- Frontend settings area with a new Tag Management page.
- Frontend transaction forms/tables to display and edit/read `Tags`.
