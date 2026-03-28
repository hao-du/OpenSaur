## Why

The `Workspaces` page now supports real administration, but `SuperAdministrator` still cannot switch into a workspace session and verify the hosted app the same way an in-scope user would experience it. We need full end-to-end impersonation now so cross-workspace administration can move from data maintenance into real session-based validation.

## What Changes

- Add a first-party impersonation flow that lets `SuperAdministrator` start a workspace-scoped session as any active user in the selected workspace or any active user who holds `SuperAdministrator`.
- Add backend auth endpoints to load impersonation candidates, start impersonation, and exit impersonation while restoring the original super-admin session.
- Extend first-party auth session handling so impersonation returns replacement access/refresh tokens instead of forcing a fresh login screen.
- Extend `/api/auth/me` so the frontend can render active workspace and impersonation state directly from authenticated session data.
- Replace the disabled workspace-table placeholder action with a real searchable `Login as` flow backed by a modal dialog.
- Keep impersonation session-wide so every tab in the same browser session converges on the impersonated identity until exit or logout.

## Capabilities

### New Capabilities
- `identity-fe-workspace-impersonation`: Workspace-driven login-as flows, impersonation shell state, and session-wide tab synchronization for the hosted frontend.

### Modified Capabilities
- `identity-authentication`: First-party auth helpers now support impersonation session switching, restoration, and impersonation-aware current-user context.

## Impact

- Affected backend code: `src/OpenSaur.Identity.Web/Features/Auth/**`, `src/OpenSaur.Identity.Web/Infrastructure/Oidc/**`, and supporting auth/security types
- Affected frontend code: `src/OpenSaur.Identity.Web/client/src/features/auth/**`, `src/OpenSaur.Identity.Web/client/src/features/workspaces/**`, `src/OpenSaur.Identity.Web/client/src/components/templates/**`, and `src/OpenSaur.Identity.Web/client/src/pages/workspaces/**`
- Affected tests: auth endpoint tests, auth bootstrap tests, shell tests, and workspace page tests
- No database schema change is expected; impersonation state is session/claim-driven
