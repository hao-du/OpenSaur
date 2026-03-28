## Why

The current frontend stops at the auth shell and a single protected home page, which is not enough to support the admin-facing workflow that comes next. We need a responsive application shell now so navigation, role-aware route visibility, and the overall workspace-oriented layout are established before workspace, user, and role features are implemented.

## What Changes

- Add a responsive authenticated app shell with a top app bar, left navigation, and main workspace content area.
- Make the navigation role-aware so `SuperAdministrator` users see `Dashboard`, `Workspace`, `Users`, and `Roles`, while non-`SuperAdministrator` users see `Dashboard` and `Users`.
- Implement desktop, tablet, and mobile shell behavior with a permanent sidebar on desktop and a collapsible drawer on tablet/mobile.
- Replace the current protected home page with an empty dashboard route that fits inside the new application shell.
- Add clickable placeholder pages for `Workspace`, `Users`, and `Roles` that are reachable from the shell now and clearly marked as coming soon.
- Keep all shell elements and layout primitives responsive so later pages can be added without reworking the shell structure.

## Capabilities

### New Capabilities
- `identity-fe-app-shell`: Responsive authenticated application shell, role-aware navigation, dashboard route, and placeholder admin routes for the frontend.

### Modified Capabilities

## Impact

- Affected code: `src/OpenSaur.Identity.Web/client/**` with emphasis on app routing, templates/layout, navigation components, and placeholder pages.
- Existing auth/session state will be reused to drive role-aware navigation and protected shell rendering.
- No backend API contract changes are required for this slice.
