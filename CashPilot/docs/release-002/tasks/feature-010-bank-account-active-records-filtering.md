# Feature 010: Bank Account Active Records Filtering Fix

## Description
Ensure all queries retrieving bank account movements and balances strictly verify the active state of both the parent `BankAccount` and child `BankAccountTransaction`:
1. In `GetCurrencyBalancesHandler.cs`, require `x.IsActive && x.BankAccount.IsActive && x.Transaction.IsActive`.
2. In `TransactionService.cs`, ensure `bankAccountTransactionsQuery` filters `bat.IsActive && bat.BankAccount.IsActive && bat.Transaction.IsActive`.
3. In `TransactionService.cs`, ensure `ShowOnlyInitialDeposits` filters `bat.IsActive && bat.BankAccount.IsActive && bat.Transaction.IsActive && bat.BankAccount.Status == BankAccountStatus.Active`.
4. In `TransactionService.cs`, ensure `LoadIncomeOutcomeRowsAsync` filters `x.IsActive && x.BankAccount.IsActive && x.Transaction.IsActive`.

---

## Tasks

- [x] Item 1: Backend Query Filters for Bank Account Active State
  - Update `GetCurrencyBalancesHandler.cs` with `x.BankAccount.IsActive`.
  - Update `TransactionService.cs` (`GetListItemsAsync` regular query & `ShowOnlyInitialDeposits`, and `LoadIncomeOutcomeRowsAsync`) with `bat.BankAccount.IsActive`.
  - Verify compilation.

