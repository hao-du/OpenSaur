# Core Business Logic

## Monetary Rules
- All amounts must be > 0.
- Transfer total must equal sum of all transaction details.
- Every financial transaction must have a valid `CurrencyId`.
- Transactions must have direction: `In` (Inflow) or `Out` (Outflow).
- Currency exchanges require a valid, positive exchange rate.
- Transfers classified as `Lend` or `Receive`.

## Security & Identity
- **Auth**: OIDC via OpenIddict; all API access requires valid JWT.
- **Authorization**: Policy-based; sensitive operations need `CanManage` or `SuperAdministrator`.
- **Immutability**: Finalized transactions are immutable (only offsetting transactions allowed).

## Domain Constraints
- Bank account status: `Active`, `Matured`, or `ClosedEarly`.
- `Matured` accounts must have a `MaturityDate`.
