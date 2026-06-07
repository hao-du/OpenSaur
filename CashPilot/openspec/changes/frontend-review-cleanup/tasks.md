## 1. Shared primitives and helpers

- [ ] 1.1 Keep a single confirm dialog implementation and route all destructive actions through it
- [ ] 1.2 Replace page-local CRUD error parsing with the shared API error helper everywhere
- [ ] 1.3 Extract reusable loading, empty-state, boolean-chip, table-actions, and form-footer atoms
- [ ] 1.4 Add a shared brand logo atom and reuse it in the side menu and centered card layout

## 2. Theme and constants cleanup

- [ ] 2.1 Centralize repeated chip, padding, and radius values into shared theme/constants
- [ ] 2.2 Move transaction type colors into a single shared source used by CSS and JSX
- [ ] 2.3 Replace stale inline color values with existing theme/layout tokens where applicable

## 3. Page and form simplification

- [ ] 3.1 Remove dead state and duplicate local logic from list pages
- [ ] 3.2 Simplify template form codec and drawer effects into dedicated helpers
- [ ] 3.3 Split the large transactions page into smaller focused components/helpers
- [ ] 3.4 Normalize the remaining CRUD/filter drawer patterns for consistency

## 4. Final cleanup

- [ ] 4.1 Replace unnecessary memoization and inline magic numbers with shared constants
- [ ] 4.2 Verify the frontend build after the cleanup batch
