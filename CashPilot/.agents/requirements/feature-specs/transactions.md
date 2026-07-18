# Transactions

**Goal**: Record, track, and manage financial movements across CashFlow, Bank, Transfer, and Exchange types.

## Transaction Types

| Type | Key Requirements |
|------|-----------------|
| **CashFlow** | Amount, currency, direction (In/Out) |
| **BankAccount** | Linked to `BankId`; supports deposits & interest movements |
| **Transfer** | Requires `CounterpartyId`; total must match sum of legs; type is `Lend` or `Receive` |
| **Exchange** | Two legs (In/Out); requires valid `ExchangeRate` |

## Advanced Features
- **Auto-Tagging**: Auto-categorize based on rules/patterns.
- **Pending Transactions**: Prepare unfinalised items; "Sync/Submit" to main ledger.
- **Dashboard**: Daily In/Out summary, Marker Calendar, Marker Tags.

## Acceptance Criteria
- [ ] CRUD for all transaction types.
- [ ] Mathematical integrity across all types.
- [ ] Dashboard summary of financial health.
