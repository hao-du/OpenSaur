## ADDED Requirements

### Requirement: Frontend cleanup preserves behavior
The frontend SHALL preserve existing user-facing behavior while consolidating duplicated UI helpers and shared patterns.

#### Scenario: CRUD actions continue to work
- **WHEN** a user creates, edits, deletes, filters, or reloads a list item in the frontend
- **THEN** the visible flow and resulting state SHALL remain functionally equivalent after the cleanup

### Requirement: Shared frontend primitives are reused
The frontend SHALL use shared atoms or helpers for repeated UI patterns that are already identical across features.

#### Scenario: Repeated UI patterns share one implementation
- **WHEN** multiple features render the same confirmation dialog, empty state, loading panel, or table action controls
- **THEN** they SHALL reuse the same shared component or helper instead of independent copies

### Requirement: Frontend error messages come from shared parsing
The frontend SHALL use the shared API error helper for page-level save and delete failures.

#### Scenario: Failed CRUD request shows the shared parsed message
- **WHEN** a CRUD request fails with a server response message or validation payload
- **THEN** the page SHALL display the parsed message from the shared API error helper

