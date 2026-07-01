# Feature Specification: Counterparties

This specification covers the management of entities (people or organizations) involved in transactions.

## Business Goal
To maintain a directory of counterparties for use in transfer transactions.

## Requirements

### Counterparty Management
- **CRUD Operations**: Users can create, read, update, and delete counterparties.
- **Transaction Linkage**: Counterparties must be selectable when creating a `Transfer` transaction.

## Acceptance Criteria
- [ ] Users can maintain a list of counterparties.
- [  ] Every transfer transaction must be linked to a valid counterparty.
