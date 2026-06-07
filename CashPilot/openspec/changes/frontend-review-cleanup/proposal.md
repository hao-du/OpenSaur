## Why

CashPilot's frontend is functional but carries avoidable duplication, inconsistent shared UI patterns, and several copy-paste leftovers from earlier iterations. Cleaning these up now reduces maintenance cost, improves consistency, and lowers the risk of future regressions as the UI continues to grow.

## What Changes

- Consolidate duplicated frontend helpers and components where the behavior is already identical.
- Standardize shared UI patterns for lists, empty/loading states, confirm dialogs, and reusable chips.
- Replace page-local utility copies with the existing shared infrastructure helpers.
- Move repeated template form state/codec logic into dedicated helper modules.
- Remove dead or unused UI state and duplicate component implementations.
- Keep external behavior unchanged unless the cleanup fixes an obvious existing bug or inconsistency.

## Capabilities

### New Capabilities
- `frontend-review-cleanup`: Improve frontend maintainability and consistency by consolidating shared UI, removing duplication, and standardizing existing patterns without changing intended product behavior.

### Modified Capabilities
- None.

## Impact

- Frontend component structure and shared UI primitives.
- Frontend list pages, form drawers, and template/tag helpers.
- Shared theme/utility usage and page-local error handling.
- Documentation trackers used to keep the refactor work organized.
