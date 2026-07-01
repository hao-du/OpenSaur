# Core Business Logic

This file contains the fundamental domain rules that must always be enforced by the system.

## Fundamental Rules

- **Monetary Integrity**: 
    - All transaction amounts must be greater than 0.
    - For transfers, the total amount must equal the sum of all transaction details.
- **Currency Enforcement**: Every financial transaction (CashFlow, BankAccount, Transfer, Exchange) must have a valid `CurrencyId`.
- **Transaction Direction**: Transactions must have a direction: `In` (Inflow) or `Out` (Outflow).

## Security & Identity

- **Authentication**: The application uses OpenID Connect (OIDC) via OpenIddict. All API access requires a valid JWT.
- **Authorization**: Access control is policy-based. Most sensitive operations require the `CanManage` permission or `SuperAdministrator` role.
- **Auditability**: Financial transactions must be immutable once finalized (no direct edits to history, only offsetting transactions).

## Domain Constraints

- **Account Status**: Bank account status can be `Active`, `Matured`, or `ClosedEarly`.
- **Maturity Rules**: If a bank account is in `Matured` status, a `MaturityDate` must be provided.
- **Exchange Rate**: Currency exchanges must involve a valid, positive exchange rate.
- **Transfer Type**: Transfers are classified as either `Lend` or `Receive`.
