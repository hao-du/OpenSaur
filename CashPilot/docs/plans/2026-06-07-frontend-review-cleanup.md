# Frontend Review Cleanup Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Clean up the frontend by consolidating duplicate UI code, removing dead state, and standardizing shared patterns without changing intended behavior.

**Architecture:** Keep the changes incremental and low-risk. Start with shared atoms/helpers and page-local utility duplication, then simplify the larger template and transaction drawers/pages. Preserve user-visible behavior except where the review already identified an obvious bug or dead code path.

**Tech Stack:** TypeScript, React, MUI, React Hook Form, existing CashPilot frontend infrastructure

---

### Task 1: Consolidate shared dialog and error handling helpers

**Files:**
- Modify: `src/OpenSaur.CashPilot.Web/client/src/components/atoms/ConfirmModal.tsx`
- Delete: `src/OpenSaur.CashPilot.Web/client/src/components/organisms/ConfirmationDialog.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/banks/pages/BanksPage.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/currencies/pages/CurrenciesPage.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/counterparties/pages/CounterpartiesPage.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/tags/pages/TagsPage.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/templates/pages/TemplatesPage.tsx`

### Task 2: Extract and standardize shared form/list UI atoms

**Files:**
- Create: `src/OpenSaur.CashPilot.Web/client/src/components/atoms/BooleanChip.tsx`
- Create: `src/OpenSaur.CashPilot.Web/client/src/components/atoms/LoadingPanel.tsx`
- Create: `src/OpenSaur.CashPilot.Web/client/src/components/atoms/EmptyStatePanel.tsx`
- Create: `src/OpenSaur.CashPilot.Web/client/src/components/atoms/TableActions.tsx`
- Create: `src/OpenSaur.CashPilot.Web/client/src/components/atoms/FormFooter.tsx`
- Create: `src/OpenSaur.CashPilot.Web/client/src/components/atoms/BrandLogo.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/banks/components/BanksList.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/currencies/components/CurrenciesList.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/counterparties/components/CounterpartiesList.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/tags/components/TagsList.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/templates/components/TemplatesList.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/components/layouts/CenteredCardLayout.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/components/organisms/SideMenu.tsx`

### Task 3: Split and normalize template drawer logic

**Files:**
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/templates/components/settings/TemplateFormDrawer.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/templates/components/settings/TemplateDataCodec.ts`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/templates/components/settings/TemplateForm.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/templates/components/TemplatePopulateDrawer.tsx`

### Task 4: Simplify transactions page helpers and shared constants

**Files:**
- Create: `src/OpenSaur.CashPilot.Web/client/src/infrastructure/constants/transactionTypeColors.ts`
- Create: `src/OpenSaur.CashPilot.Web/client/src/infrastructure/constants/transactionEnums.ts`
- Create: `src/OpenSaur.CashPilot.Web/client/src/infrastructure/constants/uiSizes.ts`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/transactions/pages/TransactionsPage.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/infrastructure/styles/transactionType.css`

### Task 5: Tidy remaining page-level cleanup items

**Files:**
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/tags/pages/TagsPage.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/features/templates/pages/TemplatesPage.tsx`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/infrastructure/theme/theme.ts`
- Modify: `src/OpenSaur.CashPilot.Web/client/src/infrastructure/config/Config.ts`
