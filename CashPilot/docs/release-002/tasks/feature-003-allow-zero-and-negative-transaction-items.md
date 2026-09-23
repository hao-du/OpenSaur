# Feature 003: Allow Zero and Negative Amounts on Transaction Items

## Description
Currently, users can only enter positive numbers in `TransactionItems` inside Add/Edit `CashFlow`, `Transfer`, `BankAccount`, and `Exchange` forms. Entering `0` or negative numbers (such as `-50.00` for discounts, deductions, or fee write-offs, or `0` for line items) is blocked by frontend inputs or formatters.

This feature enables entering `0` and negative amounts for transaction items in all four transaction types: CashFlow, Transfer, BankAccount, and Exchange.

---

## Tasks

### Item 1: Frontend Number Input Support for Negative & Zero Values
- [x] Update `Number.tsx` (or support an `allowNegative` prop) so that minus sign `-`, zero `0`, and decimal formatting work properly for negative inputs (`/^-?\d*\.?\d*$/`).
- [x] Update `formatInputNumberValue` in `numberFormatters.ts` to properly retain negative signs when formatting with thousands separators (e.g. `-1,234.56`).

### Item 2: Transaction Items Editor & Total Calculation
- [x] Verify `TransactionItemsEditor.tsx` correctly accumulates negative and zero amounts into `totalAmount`.
- [x] Test line items in `CashFlowForm`, `TransferForm`, `BankAccountForm`, and `ExchangeForm`.

### Item 3: Backend Validation & Persistence
- [x] Verify backend `TransactionItemRequest` and handlers accept zero and negative amounts without throwing validation errors.
- [x] Ensure database decimal column preserves the sign and value accurately.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.

