# Feature Specification: Transactions

This specification covers the core transactional engine of CashPilot.

## Business Goal
To allow users to record, track, and manage various types of financial movements, including simple cash flows, bank account movements, transfers between counterparties, and currency exchanges.

## Core Transaction Types

### 1. CashFlow
Simple recording of money moving in or out.
- **Requirement**: Must specify amount, currency, and direction.

### 2. BankAccount Movement
Transactions specifically linked to a bank account.
- **Requirement**: Must be associated with a `BankId`.
- **Requirement**: Supports initial deposits and interest-related movements.

### 3. Transfers
Moving money between different counterparties or accounts.
- **Requirement**: Must specify a `CounterpartyId`.
- **Requirement**: The total amount must match the sum of all transaction details (legs).
- **Requirement**: Categorized as `Lend` or `Receive`.

### 4. Currency Exchange
Exchanging one currency for another.
- **Requirement**: Must involve two "legs" (In-leg and Out-leg).
- **Requirement**: Must specify a valid `ExchangeRate`.

## Advanced Transaction Features

### Auto-Tagging
- The system can automatically categorize transactions based on predefined rules or patterns to reduce manual effort.

### Pending Transactions
- Allows users to prepare transactions that are not yet finalized.
- Provides a workflow to "Sync" or "Submit" these pending items into the main ledger.

### Dashboard & Visualization
- **Daily In/Out**: Summary of money movement per day.
- **Marker Calendar**: Visual representation of transactions on a calendar view.
- **Marker Tags**: Ability to highlight specific transactions for quick identification.

## Acceptance Criteria
- [ ] Transactions can be created, updated, and deleted.
- [ ] All transaction types (CashFlow, Bank, Transfer, Exchange) maintain mathematical integrity.
- [ ] Users can view a dashboard summary of their financial health.
