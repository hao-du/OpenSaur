# Feature 008: Dashboard Financial Summary Card

## Description
Add a new summary card placed immediately to the right of the Template card on the Dashboard. Without altering any existing backend calculation logic, this card presents three clear metrics:
1. **Tiền còn lại (Remaining money / Liquid Cash)**: Total money minus active savings.
2. **Tiền tiết kiệm (Saving money / Active Bank Deposits)**: Sum of all active bank savings.
3. **Tổng tiền (Total money / Net Worth)**: Cumulative total money (matching current Total by Currency).

---

## Tasks

### Item 1: Financial Summary Translations & New Component
- [x] Add localization keys in `translations.ts` (`en` and `vi`) for "Remaining money", "Saving money", "Total money", and card title "Financial Summary" / "Tổng quan tài chính".
- [x] Create `FinancialSummaryCard.tsx` in `client/src/features/dashboard/components/` consuming `useCurrencyBalancesQuery()` and `useActiveBankBalancesQuery()`.

### Item 2: Dashboard Layout Integration
- [x] Update `DashboardPage.tsx` to split the top row into two equal halves (`lg: 6, xs: 12`):
  - Left column: `TemplatePopulateActionCard`
  - Right column: `FinancialSummaryCard`
- [x] Verify responsive layout across screen sizes.

### Item 3: Build Verification & Review
- [x] Run `npm run build` or frontend verification check to ensure clean TypeScript compilation.
- [x] Present completed feature for manual review and approval.

### Item 4: Row Reordering & TransactionList Page Integration
- [x] In `FinancialSummaryCard.tsx`, reorder rows to: Total money (top), Saving money (middle), Remaining money (bottom).
- [x] In `TransactionDashboardPanel.tsx`, include `FinancialSummaryCard` so it appears on the Transactions page right panel.
- [x] Verify build with `npm run build`.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.
