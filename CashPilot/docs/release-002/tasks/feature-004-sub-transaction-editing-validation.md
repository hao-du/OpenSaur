# Feature 004: Sub-Transaction Editing Validation on Bank Account & Transfer

## Description
In **Bank Account** (`BankAccountForm`) and **Transfer** (`TransferForm`), users can add and edit sub-transactions (details/movements) using inline cards (`BankAccountTransactionForm`, `TransferFormTransaction`). 

Currently, if a user clicks **"THÊM GIAO DỊCH"** (Add Transaction) or enters Edit mode on a sub-transaction but hasn't clicked **"XÁC NHẬN"** (Confirm), submitting the parent form (Create / Save) proceeds anyway or silently saves with incomplete/unconfirmed draft state.

This feature ensures that if any sub-transaction is currently open in Add or Edit mode:
1. Parent form submission is blocked.
2. A clear validation error message is shown (e.g. *"Vui lòng xác nhận hoặc hủy các giao dịch đang chỉnh sửa trước khi lưu"* / *"Please confirm or cancel pending transactions before saving"*).

---

## Tasks

### Item 1: Track In-Editing State in BankAccount & Transfer
- [x] In `BankAccountForm.tsx`, lift or track the `isEditing` state of sub-transactions (or pass down an edit state callback/ref).
- [x] In `TransferForm.tsx`, lift or track the `isEditing` state of sub-transactions.

### Item 2: Validation Message & Blocking on Submit
- [x] Add translation keys for English and Vietnamese:
  - `en`: *"Please confirm or cancel all sub-transactions currently being added or edited before saving."*
  - `vi`: *"Vui lòng xác nhận hoặc hủy tất cả giao dịch đang thêm hoặc chỉnh sửa trước khi lưu."*
- [x] In `BankAccountForm.tsx`, check if any sub-transaction is in edit/new state during `submitHandler`; if so, set form error / alert and block submission.
- [x] In `TransferForm.tsx`, check if any sub-transaction is in edit/new state during `handleSave`; if so, set form error / alert and block submission.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.

