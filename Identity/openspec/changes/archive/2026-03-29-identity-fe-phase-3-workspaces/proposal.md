## Why

The responsive app shell now exposes a real `Workspace` route, but that route needs to become a working admin surface before we can add impersonation and broader directory-management flows. We need a backend-backed workspace page now so `SuperAdministrator` users can manage workspace records inside the hosted shell instead of relying on placeholder content.

## What Changes

- Replace the workspace placeholder page with a real management page backed by the existing workspace API.
- Add workspace list rendering with loading, empty, error, and populated states.
- Add client-side search and status filtering in a dedicated filter drawer.
- Add create and edit drawers for workspace maintenance, including activation-state editing in edit mode.
- Keep successful create and edit saves inside the same shell flow by refreshing the list without losing the applied filters.
- Default the workspace status filter to `Active` and treat that behavior as the baseline list-management pattern for future `Users` and `Roles` slices.
- Keep future-facing actions such as impersonation visibly deferred rather than implying they already work in this slice.

## Capabilities

### New Capabilities
- `identity-fe-workspaces`: Backend-backed workspace list management in the frontend, including filtering, create, edit, and activation-state updates.

### Modified Capabilities
- `identity-fe-app-shell`: Extend the authenticated shell so the `Workspace` route now hosts a real management page instead of a placeholder.

## Impact

- Affected code: `src/OpenSaur.Identity.Web/client/src/features/workspaces/**`, `src/OpenSaur.Identity.Web/client/src/pages/workspaces/**`, and small shell integration points
- Reuses the existing workspace backend endpoints under `/api/workspace/*`
- Establishes the frontend list/filter/drawer pattern that later `Users` and `Roles` slices will follow
