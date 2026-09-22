# Release 002 - Cache Consistency, Auth Resilience, & Transaction Improvements

## 1. Overview & Objective
Ensure strict data consistency, seamless authentication resilience, flexible transaction item amounts, robust sub-transaction editing validation, and improved savings/deposit visibility across CashPilot:
1. **Master Data Cache Invalidation**: Fix master data cache eviction across `Banks`, `Currencies`, `Counterparties`, `Tags`, and `Templates` using user-scoped domain cache version stamping.
2. **Authentication Resilience (Eliminating 401s)**:
   - Configure `BaseAddress` on `CashPilotTokenClient` so token refresh reaches the OIDC authority properly.
   - Use `ILockService` to prevent simultaneous duplicate token refresh attempts.
   - Guard `AuthTokenRefreshCookieEvents` against premature session rejection.
   - Synchronize ticket renewal with `UserSessionCookieStore` sliding expiration.
   - Add frontend Axios response interceptor for 401 redirect to `/auth/login`.
3. **Allow 0 and Negative Amounts on Transaction Items**:
   - In Add/Edit `CashFlow`, `Transfer`, `BankAccount`, and `Exchange`, support zero (`0`) and negative values in `TransactionItems` (e.g. discounts, fee deductions, rounding adjustments, or zero-cost items).
4. **Sub-Transaction In-Progress Add/Edit Validation on BankAccount and Transfer**:
   - In `BankAccountForm` and `TransferForm`, if any sub-transaction (detail item) is currently in open Add or Edit mode, block form submission (Create/Save) and display a clear validation message.
5. **Withdrawal / Maturity Date Tag on Bank Account Cards**:
   - In `TransactionListPanel.tsx`, display a distinctive chip showing the withdrawal/maturity date (e.g., `($) 17/02/2027` or `($) <WithdrawDate>`) at the bottom of the card for BankAccount items so users can instantly see when the deposit can be withdrawn.

---

## 2. Scope of Tasks

1. `docs/release-002/tasks/feature-001-master-data-cache-invalidation.md`: Fix cache invalidation across all master data entities upon create, update, and delete.
2. `docs/release-002/tasks/feature-002-auth-resilience-and-session-stability.md`: Fix token refresh, prevent premature session expiration, and handle 401s smoothly.
3. `docs/release-002/tasks/feature-003-allow-zero-and-negative-transaction-items.md`: Allow 0 and negative amount values for Transaction Items in CashFlow, Transfer, BankAccount, and Exchange forms (both UI and backend).
4. `docs/release-002/tasks/feature-004-sub-transaction-editing-validation.md`: Prevent Create/Save when sub-transactions are in Add/Edit mode in BankAccount and Transfer forms, with explicit validation messages.
5. `docs/release-002/tasks/feature-005-bank-account-withdrawal-date-badge.md`: Display a distinctive withdrawal / maturity date chip on Bank Account transaction cards.
