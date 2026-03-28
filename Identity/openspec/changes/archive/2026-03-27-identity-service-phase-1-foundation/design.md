## Context

`OpenSaur.Identity.Web` currently contains only the default ASP.NET Core minimal API skeleton. Phase 1 needs to establish the backend foundation for an identity microservice that can serve both the first-party OpenSaur web app and future third-party clients such as Umbraco. The user has explicitly required:

- PostgreSQL with EF Core migrations and manual SQL script execution only
- ASP.NET Core Identity for users/roles and OpenIddict for future client integrations
- JWT-based auth for all parties
- A shared FE login experience reused by first-party and third-party flows
- Action-style minimal APIs instead of RESTful controller/state endpoints
- Soft delete via `IsActive` instead of delete endpoints
- Audited app-owned tables with `Description`
- Transactional outbox events for user, user-role, and role-permission assignment changes
- Code-defined permission scopes with first-class scope data for UI lookup

The service must stay maintainable, so the implementation should prefer vertical slices, explicit API contracts, and the minimum infrastructure necessary to support these requirements cleanly.

## Goals / Non-Goals

**Goals:**

- Establish a single ASP.NET Core host that acts as both the first-party API backend and the central OpenIddict authorization server.
- Model users, roles, workspaces, permissions, role-permissions, user-role assignments, and outbox messages with auditable app-owned data structures.
- Model permission scopes explicitly so UI clients can load scope metadata without reverse-parsing canonical permission codes.
- Standardize `/api/*` responses on one JSON envelope so FE clients can handle success and failure consistently without special-casing HTTP-body shapes.
- Support first-party browser login using the same OpenIddict authorization code flow and rotating refresh tokens as other clients.
- Support a deterministic bootstrap administrator account that is forced through a self-service password change on first login.
- Support future third-party clients using OpenIddict authorization code flow with rotating refresh tokens.
- Enforce hierarchical permissions and workspace-aware administration.
- Apply endpoint resilience policies for rate limiting and selected write idempotency.
- Produce EF Core migrations and idempotent SQL scripts without automatically executing them.

**Non-Goals:**

- Full React/Ant Design admin UI and atomic-design component implementation
- Impersonation UI and advanced cross-workspace admin experience
- Message broker publishing from the outbox in Phase 1
- Automatic database migration execution or script execution
- Outbound dependency circuit breaker policies or distributed resilience state in Phase 1

## Decisions

### 1. Use ASP.NET Core Identity + OpenIddict in one PostgreSQL-backed host

The service will use ASP.NET Core Identity for user and role management and OpenIddict for authorization server responsibilities. This keeps first-party and third-party auth on one issuer while avoiding a future migration from a custom token service.

Alternatives considered:

- Custom JWT service without OpenIddict: simpler initially, but creates migration risk for future third-party integrations.
- Fully custom auth tables: more control, but too much security/maintenance cost for Phase 1.

### 2. Use one OpenIddict token model for all clients

Both first-party and third-party clients will use JWT access tokens issued by OpenIddict. Refresh tokens will be client-bound and rotated on every refresh. The first-party app will not have a separate custom JWT/refresh pipeline; instead, all clients will reuse the same hosted login UI and central authorization server session, while still receiving their own client-bound token sets.

Alternatives considered:

- Cookie-only first-party sessions: simpler browser flow, but rejected because the requirement is JWT for all parties.
- Separate custom first-party JWT helpers: rejected because they duplicate protocol behavior already handled by OpenIddict.
- Shared token set across clients: rejected because refresh tokens must remain client-bound for security and auditability.

### 3. Keep the login experience FE-owned while the identity service owns the auth protocol

The identity service will own the authentication/session protocol so both first-party and third-party clients can redirect into the same auth-server path. The browser-rendered login page itself will be implemented in the FE phase on the same host. That FE page will submit JSON credentials to the backend login API, and after a successful response the FE will navigate the browser back to the `returnUrl` supplied by the authorization request.

The hosted identity-server session will use the ASP.NET Core Identity application cookie with JSON `/api/auth/login` and `/api/auth/logout` backend routes. The cookie will remain separate from bearer-token API auth and will use browser-friendly cookie settings so authorization requests originating from other sites can still reuse the session when redirected back to the identity service. Anonymous authorization requests will be redirected to the FE login route, not to a server-rendered login page.

Alternatives considered:

- Separate login UI per client: increases inconsistency and maintenance cost.
- Server-rendered temporary login pages in the backend: acceptable for scaffolding, but not the desired long-term contract.

### 4. Use vertical slices with action-style minimal API endpoints

Backend use cases will be organized by feature slice, with each slice owning its endpoint mapping, request/response models, validation, and response mapping. Routes will be action-oriented where the route is a domain/account helper, such as `/api/user/get`, `/api/user/create`, `/api/user/change-workspace`, `/api/role/edit`, `/api/permission/get`, `/api/permission-scope/get`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/change-password`, and `/api/auth/me`. These custom endpoints will accept JSON bodies and return API responses only. User create/edit contracts will not accept workspace reassignment directly; workspace moves go through the dedicated super-administrator-only change-workspace action. Self-service password change remains in the auth/account helpers, while administrator password reset stays in the user-management slice. For non-super administrators, user lookups/edits are scoped in the query path to the caller's current workspace, while `SuperAdministrator` bypasses that scope. OIDC protocol endpoints like `/connect/authorize` and `/connect/token` remain standard redirect/token endpoints.

Database-backed entities remain under `Domain/**` so the persistence model stays easy to discover. `Infrastructure/**` is reserved for host plumbing such as DI, `ApplicationDbContext`, EF Core configuration/migrations, middleware, auth wiring, resilience, security adapters, and EF-backed repositories. Repositories should live under `Infrastructure/Database/Repositories/<Slice>/**`, with slice-specific repository request DTOs under `Infrastructure/Database/Repositories/<Slice>/Dtos/**`. Repositories should return application results that contain domain entities only, while feature handlers remain responsible for decorating those entities into API response models. Permission- and authorization-specific application logic should move toward the relevant feature slices instead of accumulating under generic infrastructure folders.

Alternatives considered:

- Controller-based layered architecture: familiar, but heavier than necessary for this service.
- Resource-style REST endpoints with delete semantics: rejected because the requested API style is explicit action endpoints and the service uses soft delete only.
- Generic `Repository<T>` abstractions or repositories returning feature response DTOs: rejected because they weaken slice intent and couple the database layer to API contracts.

### 5. Use app-owned entities for audited records and explicit user-role management

All custom tables will include `Id`, `Description`, `IsActive`, `UpdatedBy`, `UpdatedOn`, `CreatedBy`, and `CreatedOn`. Runtime-created app-owned rows will use `Guid.CreateVersion7()`. User-role assignments will be represented by an explicit app-owned entity so they can support auditing, soft delete, and outbox events cleanly.

Alternatives considered:

- Bare Identity join table for user-role assignment: simpler, but insufficient for the requested CRUD semantics and auditing.

### 6. Use a code-owned permission scope and permission catalog with database-backed display data

Permissions will be defined in code with stable `CodeId` values and canonical codes such as `Administrator.CanManage`, while the database stores auditable `PermissionScope` and `Permission` rows for UI lookup and assignment workflows. The `Permission` record references its scope via `PermissionScopeId`, and the code-owned catalog maps each `CodeId` to its canonical code, `PermissionScopeId`, display metadata, and rank. Authorization checks will resolve permissions by `CodeId` and apply hierarchical implication only within the same `PermissionScopeId`, where a higher-ranked permission implies all lower-ranked permissions in that same scope.

Phase 1 keeps permission scopes code-defined only. The shipped baseline is the `Administrator` scope and its related permission entries. Roles and scopes are independent concepts: multiple roles can grant permissions from the same scope, and a role does not own or define a scope. The service should also expose a dedicated permission-scope lookup endpoint so future UI clients can render scopes directly.

Alternatives considered:

- String-only permission identifiers in the database: easier to inspect manually, but weaker for stable integrations and hierarchy rules.
- Deriving scope only by parsing the canonical code string at runtime: workable for authorization, but insufficient because UI clients also need a first-class scope model.
- Duplicating implied permissions into `RolePermissions`: rejected because it creates redundant assignment rows and brittle updates.

### 7. Add a transactional outbox for user, user-role, and role-permission assignment changes

Create/update operations for users, user-role assignments, and role-permission assignments will write an outbox row in the same transaction as the business change. Phase 1 only stores outbox messages; publishing to external infrastructure is deferred.

Because Phase 1 permission definitions are code-defined and not editable through runtime APIs, the mutable "permission" surface in this phase is the role-permission assignment snapshot managed by the role create/edit flows. The outbox contract therefore records `RolePermissionsCreated` and `RolePermissionsUpdated` events that capture the role's current assigned permission `CodeId` list.

Alternatives considered:

- Direct broker publish during request handling: risks inconsistency if the DB transaction fails after a publish.
- No outbox until later: rejected because downstream event readiness is already a requirement.

### 8. Generate migrations and SQL scripts, but never auto-run them

EF Core migrations will be the schema source of truth. The project will generate idempotent SQL scripts for manual review and execution, but the application will not apply migrations on startup or execute scripts automatically.

Alternatives considered:

- Startup-applied migrations: rejected because the user wants manual DB review and execution.
- Hand-written SQL only: rejected because EF Core migrations are still needed to track schema history.

### 9. Seed a bootstrap administrator account that must rotate its password

Phase 1 seeds a deterministic `SystemAdministrator` account with the initial password `P@ssword1` so a new environment can be accessed immediately after the reviewed SQL is applied. The seeded account starts with `RequirePasswordChange = true`, and the self-service password change endpoint clears that flag. After the password is changed, the client must re-authenticate through the normal OpenIddict flow to receive updated token claims.

Alternatives considered:

- No seeded administrator account: safer by default, but it would require a separate bootstrap workflow before the service is usable.
- Seed a permanent shared administrator password: rejected because it leaves a predictable credential active longer than necessary.

### 10. Expose Swagger/OpenAPI only in Development

Phase 1 exposes Swagger/OpenAPI in `Development` so the minimal API surface can be exercised locally while the backend foundation is still evolving. Swagger remains disabled outside `Development` to avoid broadening the production identity-service surface unnecessarily.

Alternatives considered:

- No Swagger: simpler, but slows backend validation and manual endpoint exploration during Phase 1.
- Swagger in every environment: convenient, but not the preferred default for an identity-focused service.

### 11. Apply built-in rate limiting to all endpoints with stricter auth/token policies

Phase 1 will apply a default ASP.NET Core rate-limit policy to every endpoint, partitioned by authenticated user id when available and by client identity fallback for anonymous callers. Sensitive routes such as `/api/auth/login`, `/api/auth/logout`, `/api/auth/change-password`, `/connect/authorize`, and `/connect/token` will use stricter named policies.

The initial Phase 1 thresholds are:

- Default endpoints: `60` requests per `60` seconds
- Sensitive auth endpoints: `5` requests per `60` seconds
- OIDC authorize/token endpoints: `10` requests per `60` seconds

Alternatives considered:

- Protect only auth routes: rejected because the approved scope is all endpoints.
- Custom rate-limit middleware: rejected because the platform already provides the required policy and endpoint integration model.

### 12. Add idempotency only for selected mutating application endpoints

Idempotency will apply only to selected `POST`/`PUT` application endpoints such as user-management writes and later role/permission write endpoints. These endpoints will opt in through endpoint metadata, require an `Idempotency-Key`, store the first completed response together with a request fingerprint in `HybridCache`, and replay that response for safe retries. OIDC protocol endpoints will not participate in this generic idempotency mechanism because they already have protocol-defined one-time semantics.

The initial Phase 1 idempotent endpoints are:

- `/api/user/create`
- `/api/user/edit`
- `/api/user/changepassword`
- `/api/user/change-workspace`

The Phase 1 idempotency replay entry will retain responses for `5` minutes in `HybridCache`. This keeps the common caching foundation reusable for later slices while avoiding a dedicated schema table, while still covering rapid duplicate clicks and page-refresh retries. When a distributed secondary cache such as Redis is configured, replay guarantees extend across instances; without it, they remain per instance and do not survive process restarts.

Alternatives considered:

- Global idempotency for every endpoint: rejected because it adds storage and replay overhead to read paths and protocol routes that do not benefit from it.
- In-memory-only idempotency: rejected because replay guarantees would be lost across restarts.

### 13. Standardize `/api/*` responses with a shared JSON envelope and leave OIDC endpoints protocol-native

All custom application endpoints under `/api/*` will return one consistent JSON envelope with `success`, `data`, and `errors` fields so FE clients can process all successful and failed application calls through the same response contract. Successful `/api/*` responses will return `200 OK` with JSON even for create and update flows that might otherwise use `201 Created` or `204 NoContent`. When there is no success payload, `data` will be `null`.

Failed `/api/*` responses will return `success = false`, `data = null`, and an `errors` array whose items always contain string `code`, `message`, and `detail` properties. Expected application failures such as validation, authorization, not-found, and conflict outcomes should be represented through a result pattern and converted explicitly through shared helpers such as `ToApiResult` and `ToApiErrorResult`, rather than wrapping every handler in repetitive local `try/catch` blocks. That result pattern should flow naturally from the repository layer upward: repositories accept repository-specific request DTOs, return `Result<TEntity>` or `Result<IReadOnlyList<TEntity>>`, and keep HTTP and feature response contracts out of the database layer. Unexpected exceptions should be allowed to bubble to one centralized API exception normalizer that returns the same envelope for `/api/*` requests. Existing ASP.NET Core `ProblemDetails` paths should be translated into the same envelope for `/api/*` requests rather than leaking mixed response shapes. OIDC protocol endpoints under `/connect/*` remain unchanged because their redirect and token response formats must stay standards-compliant for first-party and third-party clients.

Alternatives considered:

- Keeping standard ASP.NET Core `ProblemDetails` for errors and wrapping only success responses: rejected because FE callers would still need separate parsing logic for success and failure.
- Global middleware-only wrapping of all results without explicit endpoint helpers: rejected because it obscures behavior and makes creation, validation, and protocol boundaries harder to reason about.
- Per-handler `try/catch` around every database or service call: rejected because it creates noisy handlers and inconsistent failure mapping for routine business outcomes.
- Wrapping `/connect/*` protocol endpoints with the same envelope: rejected because it would break OAuth/OpenID Connect compliance.

## Risks / Trade-offs

- [Short-lived JWT access tokens still remain valid until expiry] -> Enable OpenIddict token/authorization entry validation where appropriate and keep access tokens short-lived.
- [Using OpenIddict for the first-party app increases browser auth complexity compared with custom helper endpoints] -> Keep the protocol unified now so the FE phase only has one authentication model to integrate.
- [Client-bound token sets add more configuration] -> Register the first-party web app as an OpenIddict client and keep client registration patterns consistent for future clients.
- [Strict one-time refresh-token rotation can reject truly concurrent client refreshes] -> Set the OpenIddict refresh-token reuse leeway explicitly and keep third-party clients from parallelizing refresh attempts.
- [Manual DB execution can slow deployment] -> Generate idempotent scripts and document a clear operator workflow.
- [The bootstrap administrator credential is deterministic] -> Force `RequirePasswordChange` on first login and require operators to rotate it immediately after first use.
- [Permission hierarchy bugs could over-grant access] -> Centralize hierarchy resolution and add focused authorization tests.
- [Vertical-slice cleanup can create file churn while the feature set is still moving] -> Keep all DB entities in `Domain/**`, limit `Infrastructure/**` to host concerns, and refactor capability logic incrementally with integration-test coverage.
- [Outbox rows may accumulate if publishing is not yet implemented] -> Include processing status fields and document manual inspection/cleanup expectations.
- [Per-instance rate-limit state can diverge across scaled-out instances] -> Accept per-instance behavior in Phase 1 and keep the policy model explicit so distributed state can be added later if needed.
- [HybridCache-backed idempotency still depends on distributed cache configuration for cross-instance replay] -> Support optional Redis-backed `IDistributedCache` in Phase 1 while keeping the endpoint contract unchanged when only local cache is available.
- [Overly strict thresholds can reject legitimate auth traffic] -> Apply stricter policies only to sensitive routes and make the thresholds configurable.
- [A custom response envelope can drift from framework defaults and hide useful status semantics] -> Preserve truthful HTTP status codes for failures, keep `/connect/*` protocol-native, and cover the envelope contract with focused integration tests.

## Migration Plan

1. Add the new dependencies, Identity/OpenIddict configuration, entities, and EF Core mappings.
2. Scaffold initial EF Core migrations for Identity, OpenIddict, custom domain tables, and outbox messages.
3. Generate an idempotent SQL migration script for manual review.
4. Embed deterministic seed data for baseline roles, workspace, permission catalog rows, and the bootstrap `SystemAdministrator` account in migration-safe logic.
5. Wire the resilience policies into the host pipeline using endpoint metadata and `HybridCache`-backed idempotency replay storage.
6. After manual script execution, verify the shared OpenIddict flow, resilience behavior, and API authorization in a non-production environment.

Rollback will rely on standard database rollback procedures and migration-aware restore plans, because the service will not auto-apply schema changes.

## Operator Guidance

Phase 1 operators are expected to handle schema changes manually:

1. Generate or collect the reviewed idempotent SQL script produced from the EF Core migrations.
2. Review the script before execution instead of allowing the application to run migrations automatically.
3. Execute the script through the approved PostgreSQL administration workflow for the target environment.
4. Start or restart the application only after the reviewed script has been applied successfully.
5. Verify the shared login flow, protected `/api/*` endpoints, and the expected seed data in a non-production validation pass.

Phase 1 runtime assumptions are:

- PostgreSQL schema changes are applied manually and remain the source of truth through the recorded EF Core migration history.
- Outbox rows accumulate in the database until a later publishing/cleanup slice is added, so operators should monitor growth and inspect `Status`, `Retries`, `Error`, and `ProcessedOn` when troubleshooting.
- Rate limiting is enforced per application instance.
- Idempotent replay is per instance unless Redis-backed distributed cache is configured behind `HybridCache`.

## Open Questions

- Which initial permission catalog entries beyond the examples provided should ship in Phase 1?
- Whether first-party token exchange should be handled entirely server-side (BFF-style callback) or through a thin backend exchange endpoint behind the same host.
