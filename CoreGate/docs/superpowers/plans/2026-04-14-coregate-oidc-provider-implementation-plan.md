# CoreGate OIDC Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `OpenSaur.CoreGate.Web` into a standard OpenID Connect provider using native OpenIddict and ASP.NET Core Identity against the existing shared PostgreSQL Identity database, with a minimal React login screen.

**Architecture:** The app will reuse the shared Identity/OpenIddict database model, expose native OpenIddict endpoints plus minimal login/logout glue, and render a single React login UI. Custom code is limited to composition, DB compatibility, and claim projection modeled after the existing Identity app.

**Tech Stack:** .NET 10, ASP.NET Core Identity, OpenIddict, EF Core, PostgreSQL, Minimal API, React, Material UI, React Hook Form

---

## Constraints

- Do not add unit tests or automation tests unless explicitly requested.
- Do not add seeding or startup seeding code.
- Do not use discussion example values as real client IDs, secrets, URLs, or other production values.
- Do not create git commits automatically.
- Do not place agentic files in `src/`.

## File Structure

Planned code layout inside `src/OpenSaur.CoreGate.Web`:

- `Domain/Common/`
  Shared audited or common domain base types required by the ported identity model.

- `Domain/Identity/`
  `ApplicationUser`, `ApplicationRole`, and user-role entities reused by ASP.NET Core Identity.

- `Domain/Permissions/`
  Permission and role-permission entities used for claim projection.

- `Domain/Workspaces/`
  Workspace entities and constants used by existing claim behavior.

- `Infrastructure/Database/`
  Application `DbContext`, EF Core configurations, design-time context if required, and PostgreSQL registration.

- `Infrastructure/Security/`
  Claim type constants, principal factory, scope/resource mapping, certificate loading, and fallback key setup.

- `Infrastructure/OpenIddict/`
  OpenIddict-specific wiring helpers and minimal endpoint orchestration support.

- `Features/Auth/`
  Login/logout request models, handlers, endpoint mapping, and interactive auth flow helpers.

- `Frontend/`
  React login screen and related frontend assets/build wiring.

- `Program.cs`
  Composition root for services, middleware, OpenIddict, Identity, static assets, and endpoint mapping.

## External Reference Files

- Model reference:
  `C:\Code\New folder\OpenSaur\Identity\src\OpenSaur.Identity.Web\Domain\`

- EF Core configuration reference:
  `C:\Code\New folder\OpenSaur\Identity\src\OpenSaur.Identity.Web\Infrastructure\Database\`

- Claim projection reference:
  `C:\Code\New folder\OpenSaur\Identity\src\OpenSaur.Identity.Web\Features\Auth\AuthSessionPrincipalFactory.cs`

## Task 1: Establish project composition and package dependencies

**Files:**
- Modify: `src/OpenSaur.CoreGate.Web/OpenSaur.CoreGate.Web.csproj`
- Modify: `src/OpenSaur.CoreGate.Web/Program.cs`
- Modify: `src/OpenSaur.CoreGate.Web/appsettings.json`
- Modify: `src/OpenSaur.CoreGate.Web/appsettings.Development.json`

- [ ] Add the required NuGet packages for ASP.NET Core Identity, EF Core PostgreSQL, OpenIddict ASP.NET Core integration, OpenIddict EF Core stores, and frontend hosting/build support.
- [ ] Replace the placeholder `Program.cs` bootstrapping with a clean composition root that separates service registration from middleware/endpoints using small helper methods or extension classes.
- [ ] Add configuration sections for database connection, issuer/base URL, cookie settings, and optional signing/encryption certificate paths.
- [ ] Wire configuration binding without adding any client or user seeding logic.
- [ ] Verify the app still restores and the project structure remains readable.

## Task 2: Port the required Identity and domain model

**Files:**
- Create: `src/OpenSaur.CoreGate.Web/Domain/Common/*`
- Create: `src/OpenSaur.CoreGate.Web/Domain/Identity/*`
- Create: `src/OpenSaur.CoreGate.Web/Domain/Permissions/*`
- Create: `src/OpenSaur.CoreGate.Web/Domain/Workspaces/*`

- [ ] Port only the required domain entities from the Identity app needed for authentication, role membership, permissions, and workspace claims.
- [ ] Keep entity files small and focused; avoid importing unrelated admin or outbox concerns that are not needed for OIDC runtime behavior.
- [ ] Preserve property names and shapes required for compatibility with the existing shared database.
- [ ] Keep navigation properties and value semantics only where they are useful for runtime access and EF mapping clarity.
- [ ] Confirm the ported domain model covers all claim inputs used by the principal factory design.

## Task 3: Port EF Core database mappings and DbContext

**Files:**
- Create: `src/OpenSaur.CoreGate.Web/Infrastructure/Database/ApplicationDbContext.cs`
- Create: `src/OpenSaur.CoreGate.Web/Infrastructure/Database/Configurations/*`
- Create: `src/OpenSaur.CoreGate.Web/Infrastructure/Database/DatabaseServiceCollectionExtensions.cs`
- Optionally create: `src/OpenSaur.CoreGate.Web/Infrastructure/Database/DesignTimeApplicationDbContextFactory.cs`

- [ ] Port the required EF Core entity configurations from the Identity app for users, roles, user roles, permissions, workspaces, and any related tables needed at runtime.
- [ ] Configure the `DbContext` to use the shared PostgreSQL schema and the OpenIddict EF Core entities/stores already present in the database.
- [ ] Register ASP.NET Core Identity against the shared `ApplicationDbContext`.
- [ ] Keep all database registration in one infrastructure extension so `Program.cs` remains readable.
- [ ] Avoid migrations or schema-changing code in this task unless explicitly requested later.

## Task 4: Add security primitives and claim projection

**Files:**
- Create: `src/OpenSaur.CoreGate.Web/Infrastructure/Security/ApplicationClaimTypes.cs`
- Create: `src/OpenSaur.CoreGate.Web/Infrastructure/Security/AuthSessionPrincipalFactory.cs`
- Create: `src/OpenSaur.CoreGate.Web/Infrastructure/Security/ScopeConstants.cs`
- Create: `src/OpenSaur.CoreGate.Web/Infrastructure/Security/ResourceConstants.cs`

- [ ] Port the claim type constants needed by the existing identity/token model.
- [ ] Recreate the principal-building behavior from the reference `AuthSessionPrincipalFactory` while keeping the code explicit and readable.
- [ ] Preserve the destination rules for subject, profile, email, roles, permissions, workspace, and operational claims.
- [ ] Keep the scope/resource mapping centralized so OIDC token behavior is easy to inspect and change later.
- [ ] Ensure the implementation uses native OpenIddict principal extensions rather than custom token-building code.

## Task 5: Configure OpenIddict and signing/encryption key behavior

**Files:**
- Create: `src/OpenSaur.CoreGate.Web/Infrastructure/OpenIddict/OpenIddictServiceCollectionExtensions.cs`
- Create: `src/OpenSaur.CoreGate.Web/Infrastructure/OpenIddict/OpenIddictCertificateLoader.cs`
- Modify: `src/OpenSaur.CoreGate.Web/Program.cs`

- [ ] Register OpenIddict core, server, and ASP.NET Core integration using the shared EF Core store.
- [ ] Enable Authorization Code + PKCE and Refresh Token flows only.
- [ ] Configure native endpoints for authorize, token, userinfo, discovery, and JWKS.
- [ ] Implement certificate loading from configured paths when present.
- [ ] Implement the required fallback to `AddEphemeralEncryptionKey()` and `AddEphemeralSigningKey()` when certificate paths are not configured, for all environments.
- [ ] Keep all OpenIddict setup centralized and easy to read.

## Task 6: Build the interactive auth flow with Minimal API

**Files:**
- Create: `src/OpenSaur.CoreGate.Web/Features/Auth/LoginRequest.cs`
- Create: `src/OpenSaur.CoreGate.Web/Features/Auth/LoginResponse.cs`
- Create: `src/OpenSaur.CoreGate.Web/Features/Auth/AuthEndpoints.cs`
- Create: `src/OpenSaur.CoreGate.Web/Features/Auth/AuthService.cs`
- Create: `src/OpenSaur.CoreGate.Web/Features/Auth/AuthServiceCollectionExtensions.cs`

- [ ] Implement `GET /auth/login` to serve or route to the login UI entry.
- [ ] Implement `POST /auth/login` to validate username/password with ASP.NET Core Identity and create the interactive auth session cookie.
- [ ] Implement `POST /auth/logout` to clear the local session cleanly.
- [ ] Keep endpoint handlers thin; move orchestration into a dedicated auth service where that improves readability.
- [ ] Return user-facing validation errors safely without leaking whether an account exists.
- [ ] Do not add `/auth/me`.

## Task 7: Implement authorize, token, and userinfo principal flow integration

**Files:**
- Create: `src/OpenSaur.CoreGate.Web/Features/Auth/OpenIddictAuthorizationFlow.cs`
- Create: `src/OpenSaur.CoreGate.Web/Features/Auth/OpenIddictUserInfoHandler.cs`
- Modify: `src/OpenSaur.CoreGate.Web/Program.cs`

- [ ] Add the OpenIddict server event/endpoint glue needed to convert the authenticated Identity user into the token principal.
- [ ] Load roles, permissions, and workspace context from the shared database during authorization/token processing.
- [ ] Use the principal factory from Task 4 for consistent token claims.
- [ ] Keep the authorize/token behavior standards-compliant and let OpenIddict own protocol errors.
- [ ] Implement userinfo output using the same underlying claims model without inventing a second identity shape.

## Task 8: Add the React login UI

**Files:**
- Create: `src/OpenSaur.CoreGate.Web/Frontend/*`
- Create or modify: frontend build/config files under `src/OpenSaur.CoreGate.Web/Frontend/`
- Modify: `src/OpenSaur.CoreGate.Web/Program.cs`

- [ ] Create a minimal React login app using Material UI and React Hook Form.
- [ ] Build only the login experience; do not add account management, consent dashboards, or other admin screens.
- [ ] Submit credentials to `POST /auth/login` and handle validation failures cleanly.
- [ ] Keep styling intentional and readable, but simple enough for an identity-provider login page.
- [ ] Wire static asset serving or frontend hosting into the ASP.NET Core app without obscuring the backend auth flow.

## Task 9: Add configuration and runtime validation helpers

**Files:**
- Create: `src/OpenSaur.CoreGate.Web/Infrastructure/Configuration/*`
- Modify: `src/OpenSaur.CoreGate.Web/appsettings.json`
- Modify: `src/OpenSaur.CoreGate.Web/appsettings.Development.json`

- [ ] Add strongly typed options for issuer settings, cookie settings, and certificate paths.
- [ ] Add startup validation for missing critical configuration such as database connection and issuer URL.
- [ ] Ensure client registration is not assumed to exist in code; rely on OpenIddict/OpenID Connect errors for unknown clients.
- [ ] Keep validation messages operationally useful without exposing secrets.

## Task 10: Final integration cleanup and manual verification notes

**Files:**
- Modify: `src/OpenSaur.CoreGate.Web/Program.cs`
- Modify: `docs/agents/project.md`
- Modify: `docs/superpowers/specs/2026-04-14-coregate-oidc-provider-design.md` only if implementation-driven clarification is needed

- [ ] Remove any dead scaffolding or placeholder code left from the initial project template.
- [ ] Ensure the final composition root remains readable and follows the documented architecture.
- [ ] Update `docs/agents/project.md` with actual build/run notes for CoreGate once the implementation shape is real.
- [ ] Record manual verification steps in documentation or handoff notes instead of adding automated tests, unless explicitly requested later.
- [ ] Confirm the implementation does not add seeding code, default clients, or example values from discussion.

## Spec Coverage Check

- Standard native OpenIddict + ASP.NET Core Identity provider:
  Covered by Tasks 1, 3, 5, 6, and 7.

- Shared PostgreSQL Identity database reuse:
  Covered by Tasks 2 and 3.

- Minimal login-only frontend:
  Covered by Tasks 6 and 8.

- No `OidcClients` dependency:
  Covered by Tasks 5 and 9.

- No seeding in code:
  Covered by Constraints and Tasks 1, 5, 9, and 10.

- Claim behavior compatible with the reference principal factory:
  Covered by Tasks 4 and 7.

- Ephemeral signing/encryption fallback when certificate paths are absent:
  Covered by Task 5.

## Placeholder Scan

This plan intentionally avoids:

- placeholder client IDs
- placeholder secrets
- seeding instructions
- commit steps
- automated test tasks

## Type and Flow Consistency Check

- `ApplicationDbContext` is the shared persistence root across Identity and OpenIddict.
- `AuthSessionPrincipalFactory` is the single claim-shaping primitive.
- `AuthEndpoints` and related services own login/logout glue only.
- OpenIddict remains responsible for protocol mechanics and token issuance.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-14-coregate-oidc-provider-implementation-plan.md`.

Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh subagent per task, review between tasks, faster iteration
2. Inline Execution - execute tasks in this session in batches with checkpoints

Which approach do you want for implementation?
