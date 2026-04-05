# identity-authentication Specification

## Purpose
TBD - created by archiving change identity-service-phase-1-foundation. Update Purpose after archive.
## Requirements
### Requirement: Custom auth APIs SHALL authenticate users for the shared identity server
The system SHALL provide JSON-based authentication endpoints inside `OpenSaur.Identity.Web` that validate ASP.NET Core Identity credentials and apply account/workspace eligibility checks before issuing the shared identity-server session cookie. The actual login page UI SHALL be implemented in the FE phase and can post credentials to the backend API on the same host.

#### Scenario: Successful API login
- **WHEN** a valid user submits JSON login credentials with the correct password and the user account and workspace are active
- **THEN** the system authenticates the user, establishes the identity server login session, and returns a successful API response without redirecting the browser

#### Scenario: Invalid credentials
- **WHEN** a user submits incorrect credentials to the login API
- **THEN** the system rejects the login attempt and does not issue any session or token artifacts

#### Scenario: Inactive account or workspace
- **WHEN** a user with `IsActive = false` or a workspace with `IsActive = false` attempts to authenticate
- **THEN** the system rejects the login attempt and does not issue any session or token artifacts

#### Scenario: API logout clears the shared identity session
- **WHEN** an authenticated user completes the logout API call
- **THEN** the system clears the identity server session cookie and future authorization requests require a new login unless another policy-issued session exists

#### Scenario: Anonymous API logout is rejected
- **WHEN** a caller without a valid authenticated API session invokes the logout API
- **THEN** the system rejects the request instead of clearing the hosted session

### Requirement: First-party web SHALL use the configured issuer as the source of trust for browser auth

The system SHALL authenticate the first-party browser shell through the configured issuer instead of assuming the current browser host owns credential entry. The shared first-party client SHALL use only exact registered redirect URI(s), SHALL send authorization requests to the configured issuer from non-issuer hosts, and SHALL receive authorization responses only at a redirect URI registered for that client. First-party hosts MAY continue to use backend-assisted authorization-code exchange and refresh-cookie handling, but that token custody SHALL remain scoped to the host that owns the registered callback URI. When the first-party shell is running on the issuer host itself, the shell SHALL reuse the issuer-hosted ASP.NET Identity cookie directly for `/api/auth/*` access instead of running the authorization-code callback exchange against itself.

#### Scenario: Anonymous browser client is redirected to issuer-hosted login

- **WHEN** an anonymous user starts an authorization request from a registered browser client and no reusable hosted session exists
- **THEN** the system presents credential entry on the issuer host instead of requiring the requesting app host to collect credentials itself
- **AND** after successful authentication the issuer continues the authorization code flow for that requesting client

#### Scenario: Existing hosted session is reused across registered callback URIs

- **WHEN** a user with a valid hosted identity session starts a new authorization request for another registered callback URI on the shared first-party client
- **THEN** the system reuses the hosted session and returns the authorization response to that registered callback URI without requiring new credential entry unless policy requires it

#### Scenario: Issuer-hosted shell reuses the issuer cookie directly

- **WHEN** the first-party shell is running on the configured issuer host and the browser already has a valid issuer login session
- **THEN** the shell restores authenticated access through `/api/auth/*` helpers using that hosted session cookie
- **AND** the shell does not need to self-run `/connect/authorize` or `/api/auth/web-session/exchange` for ordinary hosted sign-in

#### Scenario: Authorization request with an unregistered redirect URI is rejected

- **WHEN** a first-party host sends an authorization request with a redirect URI that is not registered for the shared first-party client
- **THEN** the system rejects the request instead of redirecting the browser to that unregistered URI

#### Scenario: Impersonation re-enters the issuer-backed authorization flow

- **WHEN** a user starts or exits impersonation from a first-party host
- **THEN** the system updates the issuer-hosted authentication session on the issuer host first
- **AND** the browser is redirected either through the standard authorization-code flow for non-issuer hosts or directly back to the hosted issuer shell route when the shell is running on the issuer host
- **AND** the local impersonation endpoint does not mint replacement session tokens directly

### Requirement: Bootstrap administrator login SHALL force password rotation
The system SHALL seed a deterministic bootstrap `SystemAdministrator` account for first-time environment access with the initial password `P@ssword1`, SHALL return a `RequirePasswordChange` indicator after successful login for that account until its password is rotated, and SHALL clear that indicator only after the user completes a successful self-service password change.

#### Scenario: Bootstrap administrator signs in before rotating password
- **WHEN** the seeded `SystemAdministrator` account signs in with the bootstrap password `P@ssword1` and the account/workspace are active
- **THEN** the system authenticates the user and the issued access token includes `RequirePasswordChange = true`

#### Scenario: Bootstrap administrator changes password successfully
- **WHEN** the authenticated bootstrap administrator calls the dedicated password change endpoint with the current bootstrap password `P@ssword1` and a valid new password
- **THEN** the system updates the stored password, clears `RequirePasswordChange`, and requires the client to re-authenticate to obtain updated token claims

### Requirement: Third-party clients SHALL use OpenIddict authorization code flow
The system SHALL act as an OpenIddict authorization server for third-party clients and SHALL issue client-bound authorization codes, JWT access tokens, and rotating refresh tokens through the authorization code flow.

#### Scenario: Third-party client exchanges authorization code
- **WHEN** a registered third-party client exchanges a valid authorization code at the token endpoint
- **THEN** the system returns a client-bound JWT access token and rotating refresh token for that client

#### Scenario: Third-party client refreshes tokens
- **WHEN** a registered third-party client presents a valid refresh token at the token endpoint
- **THEN** the system issues a new JWT access token, rotates the refresh token, and rejects reuse of the redeemed refresh token

### Requirement: The hosted identity server session SHALL be reusable across clients
The system SHALL allow a user who already has a valid identity server login session to complete new authorization requests without re-entering credentials when no additional prompt or consent step is required.

#### Scenario: Existing login session skips credential entry
- **WHEN** an authenticated user with a valid identity server session starts a new authorization request for another registered client
- **THEN** the system reuses the hosted login session and does not force the user to re-enter credentials unless policy requires it

### Requirement: Account management helpers SHALL use explicit action routes
The system SHALL expose non-protocol account-management helper endpoints using explicit action-style routes, and those custom endpoints SHALL accept JSON request bodies instead of HTML form posts. Browser redirects SHALL be owned by the FE, while OIDC protocol endpoints continue to perform the redirects required by the standard authorization flow.

#### Scenario: Action-style account routes are available
- **WHEN** a first-party client integrates with the backend account helpers
- **THEN** the explicit account routes include `/api/auth/login`, `/api/auth/logout`, `/api/auth/change-password`, `/api/auth/me`, `/api/auth/impersonation/options/{workspaceId}`, `/api/auth/impersonation/start`, and `/api/auth/impersonation/exit`, while `/connect/authorize` and `/connect/token` handle shared authentication/token flow

### Requirement: `/api/auth/*` helpers SHALL return the common application JSON envelope
The system SHALL return a common JSON response envelope for `/api/auth/*` helper endpoints, where successful responses contain `success`, `data`, and `errors`, and failed responses normalize validation, authorization, and unexpected exception paths into the same shape. Expected authentication helper failures SHALL be represented through the application result pattern and converted into the common envelope, while unexpected exceptions SHALL be normalized centrally instead of requiring handler-local `try/catch` blocks. OIDC protocol endpoints under `/connect/*` SHALL remain standards-compliant and SHALL NOT be wrapped in the application envelope. For expected auth-helper failures, the envelope SHALL include stable error `code` values that the hosted frontend can translate independently of the English backend message text.

#### Scenario: Current-user helper includes hosted user-management capability
- **WHEN** an authenticated caller reads `/api/auth/me`
- **THEN** the response includes whether the current session can access the hosted `Users` page
- **AND** that capability already accounts for workspace scope, effective permissions, and the special `Personal` workspace rule
- **AND** the response continues to include the effective user identity, roles, workspace display name, impersonation state, and password-change state

#### Scenario: Expected auth-helper failure returns a stable code
- **WHEN** an expected auth-helper request fails because of validation, authorization, or business-rule enforcement
- **THEN** the common failure envelope includes a stable error `code` value suitable for frontend localization
- **AND** the envelope still includes English backend message/detail text as fallback diagnostics

### Requirement: Development environments SHALL expose Swagger for first-party auth helpers
The system SHALL expose Swagger/OpenAPI documentation in `Development` so the authentication helper endpoints can be explored locally, and SHALL keep Swagger disabled outside `Development`.

#### Scenario: Swagger is available in Development
- **WHEN** the service runs in `Development`
- **THEN** the Swagger/OpenAPI document includes the protected account-management endpoints and bearer-auth metadata for protected APIs

#### Scenario: Swagger is unavailable outside Development
- **WHEN** the service runs outside `Development`
- **THEN** the Swagger/OpenAPI endpoints are not exposed

### Requirement: Effective workspace-scoped role claims SHALL honor workspace role availability
The system SHALL only treat non-reserved roles as effective for a user when the role is both actively assigned to the user and actively assigned to the user's effective workspace. The reserved `SuperAdministrator` role SHALL remain effective without workspace-role assignment.

#### Scenario: Workspace role is removed after user assignment
- **WHEN** a user has an active non-reserved user-role assignment but that role is no longer assigned to the user's effective workspace
- **THEN** the issued effective role claims and permission-derived behavior SHALL exclude that role

#### Scenario: Reserved super administrator remains effective
- **WHEN** a user has the reserved `SuperAdministrator` role
- **THEN** the system treats that role as effective without requiring workspace-role assignment

### Requirement: Authenticated user settings helpers SHALL read and persist locale and timezone preferences
The system SHALL expose authenticated helper endpoints for the current user's locale and timezone preferences, SHALL persist those preferences in the user's DB-backed settings storage, and SHALL validate locale and timezone values before saving them.

#### Scenario: Authenticated user reads current settings
- **WHEN** an authenticated user requests the current-user settings helper
- **THEN** the system returns the user's persisted locale and timezone values when present
- **AND** the response remains scoped to the current authenticated user only

#### Scenario: Authenticated user saves valid settings
- **WHEN** an authenticated user submits a valid locale of `en` or `vi` and a valid IANA timezone value
- **THEN** the system persists those settings for the authenticated user
- **AND** subsequent authenticated settings reads return the saved values

#### Scenario: Invalid locale or timezone is rejected
- **WHEN** an authenticated user submits an unsupported locale or an invalid timezone value
- **THEN** the system rejects the request through the common application JSON envelope
- **AND** the previously persisted settings remain unchanged

### Requirement: Backend datetime persistence SHALL remain UTC while honoring user timezone preferences for display only
The system SHALL keep backend datetime persistence in UTC and SHALL treat the saved user timezone only as a client/display preference.

#### Scenario: User changes timezone preference
- **WHEN** an authenticated user updates the saved timezone preference
- **THEN** the system stores the timezone identifier as a user setting
- **AND** the system does not convert persisted backend datetimes away from UTC

