## Context

The hosted roles editor loads edit defaults from the role-detail query keyed by role id. A successful edit currently invalidates the role list and related supporting queries, but it does not invalidate the edited role's detail query. As a result, the drawer can reopen with stale checkbox state even though the backend save succeeded.

## Goals / Non-Goals

**Goals:**
- Refresh the edited role detail entry after a successful role save.
- Keep the change small and localized to the existing roles edit flow.

**Non-Goals:**
- Redesign the roles editor state model.
- Change backend role-permission persistence behavior.
- Add tests in this slice.

## Decisions

### Invalidate the edited role detail query on save

The existing React Query mutation already invalidates the roles list and related aggregates. The missing piece is the exact detail key for the edited role. Invalidating that key keeps the cached role detail aligned with the saved backend state while preserving the current component structure.

## Risks / Trade-offs

- [Only invalidating the list leaves stale edit defaults] -> Invalidate the exact role detail key using the edited role id.
- [Future role edit UI may depend on the same detail cache] -> Fix the cache boundary now so other permission additions behave correctly.

## Verification

- Run the relevant frontend build.
- Run OpenSpec validation for the new change.
