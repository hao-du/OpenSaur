# CoreGate OIDC Provider Design

## Summary

`OpenSaur.CoreGate.Web` will become the central OpenID Connect identity provider for the wider OpenSaur solution. It will provide one unified login experience for first-party React frontends, custom APIs, and third-party applications such as Umbraco backoffice, while remaining a standard OIDC provider built natively on OpenIddict and ASP.NET Core Identity.

The implementation will use:

- .NET 10
- ASP.NET Core Identity
- OpenIddict
- EF Core
- PostgreSQL
- Minimal API for backend endpoints
- React + Material UI + React Hook Form for the login UI

The provider will use the existing shared Identity database. User, role, permission, workspace, and existing OpenIddict data will be read from that database. CoreGate will not own user-management UI and will not seed data in application code.

## Goals

- Build a standards-compliant OIDC provider using native OpenIddict and ASP.NET Core Identity
- Make CoreGate the central identity hub for the broader solution
- Reuse the existing shared Identity PostgreSQL database
- Preserve the existing token claim behavior modeled by `AuthSessionPrincipalFactory`
- Keep the code explicit, readable, and maintainable for humans
- Support a unified interactive login experience through a minimal built-in React login screen

## Non-Goals

- User management UI
- Role management UI
- Workspace management UI
- Registration flows
- Password reset flows
- External identity providers in v1
- Client provisioning or client seeding in application code
- Non-standard OIDC protocol behavior

## Product Scope

CoreGate is the issuer and login surface only.

Included:

- OIDC authorization endpoint flow
- Token endpoint flow
- UserInfo endpoint
- Discovery and JWKS endpoints
- Local username/password sign-in against ASP.NET Core Identity tables
- Cookie-based interactive login session
- Access token, identity token, and refresh token issuance
- Claims projection from the shared Identity data model

Excluded:

- User CRUD
- Role CRUD
- Workspace CRUD
- Client CRUD
- Identity administration workflows

## Standards and Platform Direction

The provider must remain a standard OIDC provider implemented with native OpenIddict and ASP.NET Core Identity primitives.

This means:

- OpenIddict owns the OIDC protocol endpoints and token issuance behavior
- ASP.NET Core Identity owns user authentication and password validation
- EF Core owns persistence access
- PostgreSQL is the backing store
- Custom code is limited to database model compatibility, login flow coordination, and claim projection

The design intentionally avoids:

- custom token protocols
- hand-rolled password validation
- fake OIDC endpoints
- alternative auth stacks that bypass OpenIddict or Identity

## Architecture

`OpenSaur.CoreGate.Web` will be structured as a focused identity provider application with clear separation between protocol handling, login UI, database access, and claim construction.

High-level flow:

1. An OIDC client sends the user to `/connect/authorize`
2. OpenIddict validates the request
3. If the user is not authenticated, CoreGate redirects to its login screen
4. The React login screen submits credentials to a Minimal API endpoint
5. ASP.NET Core Identity validates the user against the shared database
6. CoreGate issues an interactive authentication cookie
7. The authorization flow resumes
8. OpenIddict issues authorization code, tokens, and refresh token
9. Claims are built from the shared identity data model and added to the token principal

CoreGate becomes:

- the single OIDC issuer for the platform
- the unified login experience
- the token issuer for first-party and third-party consumers
- a consumer of identity state managed by another application

## Application Structure

Inside `src/OpenSaur.CoreGate.Web`, the code should be organized into small, readable slices:

- `Domain/`
  Identity-related EF Core entities ported from the existing Identity project as needed for runtime access

- `Infrastructure/Database/`
  `DbContext`, entity configurations, and database-specific setup adapted from the Identity project

- `Infrastructure/Security/`
  claim type constants, principal construction, authentication helpers, and OpenIddict integration glue

- `Features/Auth/`
  login/logout flow and auth-specific Minimal API endpoints

- `Frontend/`
  React login UI only

- `Program.cs`
  composition root for Identity, OpenIddict, EF Core, frontend hosting, and endpoint registration

The code should favor explicit wiring over hidden abstractions so the request flow is easy to trace.

## Shared Database Model

CoreGate will reuse the existing shared Identity PostgreSQL database.

Reference sources:

- EF Core model domain:
  `C:\Code\New folder\OpenSaur\Identity\src\OpenSaur.Identity.Web\Domain`
- EF Core database configuration:
  `C:\Code\New folder\OpenSaur\Identity\src\OpenSaur.Identity.Web\Infrastructure\Database`
- claim projection reference:
  `C:\Code\New folder\OpenSaur\Identity\src\OpenSaur.Identity.Web\Features\Auth\AuthSessionPrincipalFactory.cs`

CoreGate should port or adapt the required runtime entities and mappings for:

- ASP.NET Core Identity users
- roles
- user-role joins
- permissions
- workspaces
- OpenIddict tables already present in the database

The design should reuse the existing schema shape rather than inventing a parallel identity model.

## OIDC Grants and Consumer Support

Initial supported flows:

- Authorization Code with PKCE
- Refresh Tokens

Initial user authentication:

- local username/password only

Target consumers:

- first-party React frontends
- first-party APIs using bearer tokens
- third-party OIDC consumers such as Umbraco backoffice

Because this is a shared issuer, the provider should prioritize interoperability and standards compliance over app-specific shortcuts.

## OIDC Client Strategy

CoreGate will not use the `OidcClients` table.

CoreGate will use OpenIddict's native application store for registered OIDC clients.

Important operational constraints:

- CoreGate will not seed clients in application code
- CoreGate will not invent default clients
- CoreGate will not treat example names from discussion as real configuration values
- Client registration is assumed to happen outside this app

As a result, CoreGate expects OIDC client records to already exist in the shared database before a client can authenticate.

If a client is missing or invalid, the system should return standard OpenIddict/OIDC errors rather than fallback behavior.

## Endpoint Surface

OIDC endpoints:

- `/connect/authorize`
- `/connect/token`
- `/connect/userinfo`
- `/.well-known/openid-configuration`
- `/.well-known/jwks`

Interactive auth endpoints:

- `GET /auth/login`
- `POST /auth/login`
- `POST /auth/logout`

Not included:

- `/auth/me`
- registration endpoints
- password reset endpoints
- client-management endpoints
- user-management endpoints

This keeps CoreGate focused on issuer responsibilities only.

## Frontend Design

The frontend scope is intentionally minimal.

There is only one built-in UI:

- login screen

Technology:

- React
- Material UI
- React Hook Form

Responsibilities:

- render the login form
- validate required credentials
- submit to backend login endpoint
- display auth errors
- return the user to the OIDC flow

Not in scope:

- profile pages
- account settings
- workspace switcher UI
- user management UI
- consent management UI unless later required

## Claims and Principal Construction

CoreGate should preserve the claim behavior modeled by `AuthSessionPrincipalFactory`.

Claims to populate:

- subject/user id
- username
- preferred username
- email when present
- workspace id
- require-password-change flag
- impersonation-related claims if that capability remains active in the shared model
- roles
- permissions

Claim destination behavior should remain explicit and scope-aware:

- subject in access token and identity token
- profile claims only when appropriate profile scopes are granted
- email only when email scope is granted
- roles only when roles scope is granted
- permissions only in access token when the relevant API scope/resource is granted
- internal operational claims only in access token

This preserves compatibility for downstream apps while keeping the provider standards-compliant.

## Session and Authentication Behavior

Interactive sign-in should use a secure authentication cookie.

Behavior:

- unauthenticated authorization requests redirect to login
- successful login creates local auth session
- logout clears the local session
- OpenIddict uses the authenticated principal to continue protocol flow

ASP.NET Core Identity remains the single source of truth for local credential validation.

The existing seeded administrator account already present in the shared database can be used operationally, but the provider must not rely on any hardcoded account values in code.

## Signing and Encryption Keys

CoreGate should prefer configured certificate-based signing and encryption keys.

If configured certificate paths are unavailable, CoreGate should fall back to:

```csharp
builder.AddEphemeralEncryptionKey()
       .AddEphemeralSigningKey();
```

This fallback applies consistently in all environments.

Operational note:

- ephemeral keys are acceptable as fallback behavior
- token validation continuity will not survive app restart when ephemeral keys are used
- persistent certificates remain the preferred long-term production setup

## Configuration Model

Configuration should be environment-driven and explicit.

Expected configuration categories:

- database connection string
- issuer/public base URL
- cookie settings
- OpenIddict signing certificate path
- OpenIddict encryption certificate path
- logging and environment settings

The application should not rely on:

- seeded clients in code
- sample client IDs or secrets from discussion
- hardcoded issuer-specific sample data

## Error Handling

The provider should keep external behavior standards-compliant and internal behavior diagnosable.

Rules:

- invalid login should not leak whether a username exists
- protocol errors should flow through native OpenIddict/OIDC responses
- unknown client, bad redirect URI, invalid scope, bad code, and invalid refresh token should return standard protocol errors
- internal failures should be logged clearly server-side without exposing sensitive implementation details

## Code Quality Principles

Because CoreGate becomes the identity hub for the solution, code quality should optimize for maintainability and operational clarity.

Principles:

- keep files focused and small
- prefer explicit flow over clever abstractions
- separate protocol logic from database logic and UI logic
- reuse existing schema and claim concepts where compatibility matters
- avoid hidden framework magic where explicit code is clearer
- make request-to-token flow easy for a human engineer to follow

The primary design goal is not just correctness. It is readability under real-world maintenance.

## Risks and Constraints

- Shared database compatibility must be preserved
- Token shape changes can affect many consumers
- Ephemeral signing/encryption fallback causes key rotation on restart
- External client provisioning must be handled operationally outside this application
- Using the shared identity database means CoreGate must be careful not to assume ownership of administration workflows

## Final Design Decision

Build `OpenSaur.CoreGate.Web` as a standard OIDC provider using native OpenIddict and ASP.NET Core Identity against the existing shared PostgreSQL Identity database, with a minimal React login screen, no in-code seeding, no `OidcClients` dependency, and claims modeled after the existing `AuthSessionPrincipalFactory`.
