# Feature 005: Bank Account Withdrawal / Maturity Date Tag on Transaction Cards

## Description
On the **Transactions** page (`TransactionListPanel`), Bank Account cards currently show:
- Bank short name (e.g. `TCB`, `CTG`)
- Status (`Đang hoạt động`)
- Movement type (`Nạp gốc ban đầu`)
- Tags (`Gửi tiết kiệm`)

Users need to quickly identify **when the funds can be withdrawn** (the Maturity / Withdrawal Date) directly from the transaction list without having to click into Edit mode.

This feature adds a distinctive badge/tag in a different color at the bottom of Bank Account cards:
- Format: `($) <WithdrawDate>` (e.g., `($) 09/03/2027`).
- Color: Distinctive styling (e.g., info/cyan or purple or warning tone) to stand out from normal tags and bank status tags.

---

## Tasks

### Item 1: Backend Projection of Maturity / Withdrawal Date
- [ ] Add `DateOnly? MaturityDate` to `TransactionListItemResponse` in `TransactionDtos.cs`.
- [ ] In `TransactionService.cs`, populate `bat.BankAccount.MaturityDate` when projecting Bank Account transactions in `GetListItemsAsync` and `LoadIncomeOutcomeRowsAsync`.

### Item 2: Frontend Display in TransactionListPanel
- [ ] Update frontend `TransactionListItemDto` in `TransactionDto.ts` to include `maturityDate?: string | null`.
- [ ] In `TransactionListPanel.tsx`, render a custom styled Chip for Bank Account cards that have a `maturityDate`:
  - Icon: Lucide icon component (such as `CircleDollarSign` or `HandCoins` from `lucide-react`) passed via the Chip's `icon` prop.
  - Label: Formatted date using user's locale: `formatDate(item.maturityDate)`.
  - Color: Distinctive styling (e.g. custom soft teal/cyan or purple background) positioned clearly at the bottom of the card.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.
