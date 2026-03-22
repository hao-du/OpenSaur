## Why

`src/OpenSaur.Identity.Web` is still a minimal ASP.NET Core starter and does not yet provide the identity, authorization, data, and integration foundation required for the OpenSaur identity service. We need a production-shaped backend baseline now so the first-party web app and future third-party clients can reuse the same identity server, permission model, and data contracts without a second auth rewrite later.

## What Changes

- Add a PostgreSQL-backed identity foundation using EF Core, ASP.NET Core Identity, and OpenIddict in `src/OpenSaur.Identity.Web`.
- Add action-style minimal API endpoints for authentication, users, roles, permissions, user-role assignments, and supporting reads.
- Add app-owned audited entities and tables for workspaces, permissions, role-permissions, user-role assignments, and outbox messages.
- Add a permission catalog model that uses stable `CodeId` integers, display-friendly names, descriptions, and hierarchical implication rules.
- Add JSON-based login/logout backend APIs that support both first-party and third-party OpenIddict authorization code flow with rotating refresh tokens and shared auth-server session reuse, while deferring the actual login page UI to the FE phase.
- Add development-only Swagger/OpenAPI output so the Phase 1 authentication endpoints can be explored and tested locally.
- Add migration-backed schema creation, deterministic seed data, and idempotent SQL script generation for manual database review/execution.
- Add a deterministic bootstrap `SystemAdministrator` account that requires a password change on first login for first-time environment access.
- Add transactional outbox events for user, user-role, and permission create/update operations.
- Remove hard-delete API behavior. Entity deactivation SHALL be done by editing `IsActive`.

## Capabilities

### New Capabilities
- `identity-authentication`: JSON-based identity server login/logout plus a shared OpenIddict authorization code flow for first-party and third-party clients with client-bound refresh token rotation.
- `identity-directory-management`: User, role, user-role, and workspace management APIs with action-style minimal endpoints, audit columns, and soft delete through `IsActive`.
- `identity-permissions`: Permission catalog, role-permission assignment, and hierarchical permission implication using stable `CodeId` values.
- `identity-persistence-foundation`: PostgreSQL/EF Core/Identity/OpenIddict schema, migration generation, baseline seed data, and manual DB script workflow.
- `identity-outbox`: Transactional outbox storage for user, user-role, and permission lifecycle events.

### Modified Capabilities

None.

## Impact

- Affected code: `src/OpenSaur.Identity.Web/**`
- New database schema in PostgreSQL for Identity, OpenIddict, workspaces, permissions, role-permissions, app-owned user-role records, and outbox messages
- New hosted login/auth server endpoints and new `/api/*` identity management endpoints
- New package dependencies for EF Core PostgreSQL, ASP.NET Core Identity, OpenIddict, and related auth/data infrastructure
- New EF Core migrations and generated idempotent SQL scripts for manual review and execution
