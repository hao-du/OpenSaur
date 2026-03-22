## Context

`OpenSaur.Identity.Web` currently contains only the default ASP.NET Core minimal API skeleton. Phase 1 needs to establish the backend foundation for an identity microservice that can serve both the first-party OpenSaur web app and future third-party clients such as Umbraco. The user has explicitly required:

- PostgreSQL with EF Core migrations and manual SQL script execution only
- ASP.NET Core Identity for users/roles and OpenIddict for future client integrations
- JWT-based auth for all parties
- A shared hosted login screen reused by first-party and third-party flows
- Action-style minimal APIs instead of RESTful controller/state endpoints
- Soft delete via `IsActive` instead of delete endpoints
- Audited app-owned tables with `Description`
- Transactional outbox events for user, user-role, and permission changes

The service must stay maintainable, so the implementation should prefer vertical slices, explicit API contracts, and the minimum infrastructure necessary to support these requirements cleanly.

## Goals / Non-Goals

**Goals:**

- Establish a single ASP.NET Core host that acts as both the first-party API backend and the central OpenIddict authorization server.
- Model users, roles, workspaces, permissions, role-permissions, user-role assignments, and outbox messages with auditable app-owned data structures.
- Support first-party browser login using JWT access tokens plus a protected refresh-token mechanism.
- Support a deterministic bootstrap administrator account that is forced through a self-service password change on first login.
- Support future third-party clients using OpenIddict authorization code flow with rotating refresh tokens.
- Enforce hierarchical permissions and workspace-aware administration.
- Produce EF Core migrations and idempotent SQL scripts without automatically executing them.

**Non-Goals:**

- Full React/Ant Design admin UI and atomic-design component implementation
- Impersonation UI and advanced cross-workspace admin experience
- Message broker publishing from the outbox in Phase 1
- Automatic database migration execution or script execution

## Decisions

### 1. Use ASP.NET Core Identity + OpenIddict in one PostgreSQL-backed host

The service will use ASP.NET Core Identity for user and role management and OpenIddict for authorization server responsibilities. This keeps first-party and third-party auth on one issuer while avoiding a future migration from a custom token service.

Alternatives considered:

- Custom JWT service without OpenIddict: simpler initially, but creates migration risk for future third-party integrations.
- Fully custom auth tables: more control, but too much security/maintenance cost for Phase 1.

### 2. Use JWT access tokens for all clients, but keep refresh tokens client-bound and protected

Both first-party and third-party clients will use JWT access tokens. Refresh tokens will be client-bound and rotated on every refresh. The first-party app will not share token instances with third-party clients; instead, all clients will reuse the same hosted login UI and central authorization server session.

Alternatives considered:

- Cookie-only first-party sessions: simpler browser flow, but rejected because the requirement is JWT for all parties.
- Shared token set across clients: rejected because refresh tokens must remain client-bound for security and auditability.

### 3. Keep the hosted login UI inside the identity service

The identity service will own the login experience so both first-party and third-party clients can redirect to the same hosted screen. A successful login establishes the authorization server session and allows silent reuse of that login across clients when policy permits.

Alternatives considered:

- Separate login UI hosted by the first-party app: weakens reuse and complicates third-party client integration.
- Different login screens per client: increases inconsistency and maintenance cost.

### 4. Use vertical slices with action-style minimal API endpoints

Backend use cases will be organized by feature slice, with each slice owning its endpoint mapping, request/response models, validation, and data access. Routes will be action-oriented, such as `/api/user/get`, `/api/user/create`, `/api/role/edit`, and `/api/auth/refresh`, to align with the requested API style.

Alternatives considered:

- Controller-based layered architecture: familiar, but heavier than necessary for this service.
- Resource-style REST endpoints with delete semantics: rejected because the requested API style is explicit action endpoints and the service uses soft delete only.

### 5. Use app-owned entities for audited records and explicit user-role management

All custom tables will include `Id`, `Description`, `IsActive`, `UpdatedBy`, `UpdatedOn`, `CreatedBy`, and `CreatedOn`. Runtime-created app-owned rows will use `Guid.CreateVersion7()`. User-role assignments will be represented by an explicit app-owned entity so they can support auditing, soft delete, and outbox events cleanly.

Alternatives considered:

- Bare Identity join table for user-role assignment: simpler, but insufficient for the requested CRUD semantics and auditing.

### 6. Use a code-owned permission catalog with database-backed display data

Permissions will be defined in code with stable `CodeId` values and canonical codes, while the database stores the user-facing display `Name`, `Description`, and audit fields. Authorization checks will resolve permissions by `CodeId` and apply hierarchical implication inside permission families.

Alternatives considered:

- String-only permission identifiers in the database: easier to inspect manually, but weaker for stable integrations and hierarchy rules.
- Duplicating implied permissions into `RolePermissions`: rejected because it creates redundant assignment rows and brittle updates.

### 7. Add a transactional outbox for user, user-role, and permission changes

Create/update operations for users, user-role assignments, and permissions will write an outbox row in the same transaction as the business change. Phase 1 only stores outbox messages; publishing to external infrastructure is deferred.

Alternatives considered:

- Direct broker publish during request handling: risks inconsistency if the DB transaction fails after a publish.
- No outbox until later: rejected because downstream event readiness is already a requirement.

### 8. Generate migrations and SQL scripts, but never auto-run them

EF Core migrations will be the schema source of truth. The project will generate idempotent SQL scripts for manual review and execution, but the application will not apply migrations on startup or execute scripts automatically.

Alternatives considered:

- Startup-applied migrations: rejected because the user wants manual DB review and execution.
- Hand-written SQL only: rejected because EF Core migrations are still needed to track schema history.

### 9. Seed a bootstrap administrator account that must rotate its password

Phase 1 seeds a deterministic `SystemAdministrator` account so a new environment can be accessed immediately after the reviewed SQL is applied. The seeded account starts with `RequirePasswordChange = true`, and the self-service password change endpoint clears that flag and returns a fresh access token after a successful password update.

Alternatives considered:

- No seeded administrator account: safer by default, but it would require a separate bootstrap workflow before the service is usable.
- Seed a permanent shared administrator password: rejected because it leaves a predictable credential active longer than necessary.

### 10. Expose Swagger/OpenAPI only in Development

Phase 1 exposes Swagger/OpenAPI in `Development` so the minimal API surface can be exercised locally while the backend foundation is still evolving. Swagger remains disabled outside `Development` to avoid broadening the production identity-service surface unnecessarily.

Alternatives considered:

- No Swagger: simpler, but slows backend validation and manual endpoint exploration during Phase 1.
- Swagger in every environment: convenient, but not the preferred default for an identity-focused service.

## Risks / Trade-offs

- [Short-lived JWT access tokens still remain valid until expiry] -> Enable OpenIddict token/authorization entry validation where appropriate and keep access tokens short-lived.
- [Using JWT for the first-party app increases browser auth complexity compared with cookie-only sessions] -> Hide refresh tokens from JavaScript and keep the first-party refresh flow backend-assisted.
- [Client-bound token sets add more configuration] -> Register the first-party web app as an OpenIddict client and keep client registration patterns consistent for future clients.
- [Manual DB execution can slow deployment] -> Generate idempotent scripts and document a clear operator workflow.
- [The bootstrap administrator credential is deterministic] -> Force `RequirePasswordChange` on first login and require operators to rotate it immediately after first use.
- [Permission hierarchy bugs could over-grant access] -> Centralize hierarchy resolution and add focused authorization tests.
- [Outbox rows may accumulate if publishing is not yet implemented] -> Include processing status fields and document manual inspection/cleanup expectations.

## Migration Plan

1. Add the new dependencies, Identity/OpenIddict configuration, entities, and EF Core mappings.
2. Scaffold initial EF Core migrations for Identity, OpenIddict, custom domain tables, and outbox messages.
3. Generate an idempotent SQL migration script for manual review.
4. Embed deterministic seed data for baseline roles, workspace, permission catalog rows, and the bootstrap `SystemAdministrator` account in migration-safe logic.
5. After manual script execution, verify the first-party auth flow and API authorization in a non-production environment.

Rollback will rely on standard database rollback procedures and migration-aware restore plans, because the service will not auto-apply schema changes.

## Open Questions

- Which initial permission catalog entries beyond the examples provided should ship in Phase 1?
- Whether first-party token exchange should be handled entirely server-side (BFF-style callback) or through a thin backend exchange endpoint behind the same host.
