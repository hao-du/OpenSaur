## Context

The frontend has a consistent product shape, but many views still duplicate the same loading/empty states, confirmation flows, error parsing, and inline UI values. Some components also carry state or helpers that now belong in shared utilities after recent feature work.

This change is a cleanup pass over the frontend under `client/src/`. The goal is to reduce duplication and improve maintainability without changing intended user-facing behavior.

## Goals / Non-Goals

**Goals:**
- Consolidate duplicated shared UI helpers and atoms.
- Standardize repeated list-page and form-page patterns.
- Remove dead or redundant state and component implementations.
- Keep visible behavior stable except where the review already identified an obvious bug or inconsistency.

**Non-Goals:**
- Redesign the transaction or template UX.
- Change backend APIs or data contracts.
- Introduce new product features.
- Add tests in this cleanup pass.

## Decisions

1. Prefer shared atoms over page-local copies
- Decision: extract reusable UI primitives for confirm dialogs, loading/empty states, table actions, and common chips.
- Rationale: the same markup and behavior already appears in multiple features, so shared atoms reduce drift.
- Alternative considered: leave repeated JSX in each page. Rejected because it increases maintenance cost and makes styling changes inconsistent.

2. Keep page-specific business logic in the page
- Decision: only extract common UI and helper logic that is demonstrably identical. Preserve feature-specific state handling where the surrounding flow differs.
- Rationale: the CRUD pages and transaction drawers are similar but not identical; over-abstracting them would make debugging harder.
- Alternative considered: a single generic CRUD-page hook/component. Rejected for now because the pages differ enough in form shape and side effects that the abstraction would become leaky.

3. Centralize formatting and helper logic where behavior is already shared
- Decision: replace page-local error parsing with the existing shared API error helper and keep template codec logic in a dedicated module.
- Rationale: these helpers already have one correct implementation and the pages should reuse it instead of maintaining copies.
- Alternative considered: keep local helpers per page. Rejected because it encourages future divergence and inconsistent error messages.

## Risks / Trade-offs

- [Broad refactor may introduce regressions] -> Keep each extraction behavior-preserving, update one shared primitive at a time, and verify the frontend build after the batch.
- [Shared atoms may become too generic] -> Only extract repeated patterns that already have the same behavior across features.
- [Theme/token normalization may take longer than the immediate cleanup] -> Address the most obvious duplicate inline values first and defer deeper theme work if it requires a wider redesign.
