# Plan: Refactor useExchangeTransactionLogic to remove setTimeout

## Context
The `useExchangeTransactionLogic` hook currently uses `setTimeout(..., 0)` within a `useEffect` hook to manage state transitions (e.g., clearing `pendingEditId` or opening the edit modal) and to suppress ESLint warnings (`react-hooks/set-state-in-effect`). This is non-idiomatic React and can lead to non-deterministic behavior. A similar implementation in `useCashFlowTransactionLogic` uses `eslint-disable-next-line` instead, which is the preferred pattern in this codebase.

## Proposed Changes

### src/OpenSaur.CashPilot.Web/client/src/features/transactions/hooks/exchange/useExchangeTransactionLogic.ts

#### 1. Remove `setTimeout` in error handling
Replace the `setTimeout` around `setPendingEditId(null)` with a direct call, and add the `// eslint-disable-next-line react-hooks/set-state-in-effect` comment to follow the project's established pattern for this specific case.

#### 2. Remove `setTimeout` in successful data loading
Replace the `setTimeout` that wraps the state updates when `currencyExchangeQuery.data` is available. This state update is intended to transition the UI to the editing state.

## Verification

- Check that `useExchangeTransactionLogic` no longer uses `setTimeout`.
- Verify that the `eslint-disable-next-line` comments are present where needed.
- Verify that the component still correctly handles error states and successfully opens the edit modal when data is loaded.
