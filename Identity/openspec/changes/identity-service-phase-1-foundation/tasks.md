## 1. Foundation Setup

- [ ] 1.1 Add the required package references and establish the vertical-slice project structure for auth, users, roles, permissions, user-role assignments, workspaces, and outbox handling.
- [x] 1.2 Configure PostgreSQL, ASP.NET Core Identity, OpenIddict, authentication/authorization, and configuration binding without hardcoding environment secrets.

## 2. Domain And Persistence Model

- [x] 2.1 Implement the audited base entity patterns and app-owned entities for workspaces, permissions, role-permissions, user-role assignments, and outbox messages, plus the extended Identity entities.
- [x] 2.2 Configure EF Core mappings for Identity, OpenIddict, JSON user settings, workspace membership, role-permission assignments, and outbox storage.
- [x] 2.3 Implement the code-owned permission catalog, canonical permission metadata, and hierarchical implication resolution by `CodeId`.
- [x] 2.4 Scaffold EF Core migrations and generate idempotent PostgreSQL SQL scripts for manual review/execution.
- [x] 2.5 Seed deterministic baseline data for default roles, the `Personal` workspace, and the initial permission catalog.
- [x] 2.6 Add a code-defined `PermissionScope` entity/table, persistence mapping, and deterministic seed data for shipped scopes.

## 3. Authentication And Authorization Flows

- [x] 3.1 Implement the JSON login/logout backend flow and eligibility checks for active users and workspaces, and defer the actual login page UI to the FE phase.
- [x] 3.2 Align first-party protected account endpoints with OpenIddict-issued bearer tokens and the bootstrap password-change requirement.
- [x] 3.3 Configure OpenIddict authorization code flow with rotating refresh tokens for registered third-party clients.
- [x] 3.4 Implement current-user/session bootstrap behavior and shared hosted login session reuse across clients.
- [x] 3.5 Enforce workspace-aware role checks and permission-based authorization across protected endpoints.
- [x] 3.6 Adjust permission resolution so implication is based on `PermissionScopeId` and rank, with no cross-scope implication.

## 4. Identity Management APIs

- [x] 4.1 Implement action-style user endpoints for get, get-by-id, create, edit, and password change with soft delete through `IsActive`.
- [x] 4.2 Implement action-style role endpoints for get, get-by-id, create, and edit.
- [x] 4.3 Implement action-style permission endpoints for permission lookup and role-permission assignment support.
- [x] 4.4 Implement action-style user-role endpoints for get, create, and edit using app-owned user-role records.
- [x] 4.5 Implement workspace lookup and management support needed for Phase 1 backend scope without delete endpoints.
- [x] 4.6 Implement action-style permission-scope endpoints for UI lookup and include explicit scope metadata in permission responses.
- [x] 4.7 Reorganize permission- and authorization-related application code to better follow vertical-slice boundaries while keeping DB-backed entities in `Domain/**`.
- [x] 4.8 Implement slice-specific repositories under `Infrastructure/Database/Repositories/*` with repository request DTOs under `Dtos/*`, return `Result<TEntity>`/`Result<IReadOnlyList<TEntity>>` with domain entities only, and use them to support the shared application result pattern plus `ToApiResult` and `ToApiErrorResult` helpers for expected `/api/*` outcomes while keeping `/connect/*` protocol responses unchanged.
- [x] 4.9 Add centralized `/api/*` exception normalization that maps unexpected exceptions, validation, and `ProblemDetails` paths into the common error envelope while keeping successful application responses on `200 OK`.

## 5. Outbox And Event Recording

- [ ] 5.1 Define domain event payload contracts for user, user-role, and permission create/update operations.
- [ ] 5.2 Write outbox messages transactionally for user, user-role, and permission create/update operations.
- [ ] 5.3 Ensure deactivation flows emit update events and never emit delete events for soft-deleted records.

## 6. Verification And Operator Guidance

- [x] 6.1 Add automated tests for login, refresh, bootstrap password change, authorization, workspace scoping, and permission hierarchy behavior.
- [ ] 6.2 Add automated tests for outbox message creation and soft-delete behavior.
- [ ] 6.3 Document the manual migration-script review/execution workflow and the Phase 1 operational assumptions.
- [x] 6.4 Add development-only Swagger/OpenAPI support with bearer-auth documentation and host-level availability tests.
- [x] 6.5 Add automated tests for permission-scope lookup and scope-based permission implication behavior.
- [x] 6.6 Add automated tests for the common `/api/*` response envelope, including normalized validation/auth/not-found failures and unexpected exception handling.

## 7. Endpoint Resilience

- [x] 7.1 Add the required ASP.NET Core resilience dependencies and configuration options for rate limiting and idempotency.
- [x] 7.2 Configure a default rate-limit policy for all endpoints with stricter named policies for sensitive auth and token routes.
- [x] 7.3 Add `HybridCache`-backed idempotency handling for selected mutating application endpoints using `Idempotency-Key`, endpoint metadata, and request fingerprinting.
- [x] 7.4 Add automated tests for rate limiting and idempotent replay/conflict handling.
- [x] 7.5 Document Phase 1 resilience thresholds, idempotency storage assumptions, and rollback expectations.
