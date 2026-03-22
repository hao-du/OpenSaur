## ADDED Requirements

### Requirement: Hosted login SHALL authenticate users for the shared identity server
The system SHALL provide a hosted login experience inside `OpenSaur.Identity.Web` that validates ASP.NET Core Identity credentials and applies account/workspace eligibility checks before issuing authentication artifacts.

#### Scenario: Successful hosted login
- **WHEN** a valid user submits the hosted login form with correct credentials and the user account and workspace are active
- **THEN** the system authenticates the user, establishes the identity server login session, and continues the requesting client flow

#### Scenario: Invalid credentials
- **WHEN** a user submits incorrect credentials to the hosted login form
- **THEN** the system rejects the login attempt and does not issue any session or token artifacts

#### Scenario: Inactive account or workspace
- **WHEN** a user with `IsActive = false` or a workspace with `IsActive = false` attempts to authenticate
- **THEN** the system rejects the login attempt and does not issue any session or token artifacts

### Requirement: First-party web SHALL use JWT access tokens with protected refresh handling
The system SHALL support the first-party web client with JWT access tokens, a client-bound rotating refresh token, and explicit action endpoints for login, refresh, logout, and current-user bootstrap.

#### Scenario: First-party login returns JWT access token
- **WHEN** the first-party client completes a successful login flow
- **THEN** the system returns a JWT access token for the first-party client and stores the refresh token using a protected mechanism that is not readable by browser JavaScript

#### Scenario: First-party refresh rotates refresh token
- **WHEN** the first-party client calls the refresh endpoint with a valid refresh token chain
- **THEN** the system returns a new JWT access token, rotates the refresh token, and invalidates the previously redeemed refresh token

#### Scenario: First-party bootstrap fails after session expiry
- **WHEN** the first-party client attempts to bootstrap the current session and no valid access/refresh path remains
- **THEN** the system returns an authentication failure that allows the client to redirect the user back to login

### Requirement: Bootstrap administrator login SHALL force password rotation
The system SHALL seed a deterministic bootstrap `SystemAdministrator` account for first-time environment access, SHALL return a `RequirePasswordChange` indicator after successful login for that account until its password is rotated, and SHALL clear that indicator only after the user completes a successful self-service password change.

#### Scenario: Bootstrap administrator signs in before rotating password
- **WHEN** the seeded `SystemAdministrator` account signs in with the bootstrap password and the account/workspace are active
- **THEN** the system authenticates the user and returns a first-party auth response with `RequirePasswordChange = true`

#### Scenario: Bootstrap administrator changes password successfully
- **WHEN** the authenticated bootstrap administrator calls the dedicated password change endpoint with the current bootstrap password and a valid new password
- **THEN** the system updates the stored password, clears `RequirePasswordChange`, rotates the protected refresh state, and returns a fresh first-party auth response with `RequirePasswordChange = false`

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

### Requirement: Authentication APIs SHALL use explicit action routes
The system SHALL expose first-party authentication helper endpoints using explicit action-style routes rather than combined RESTful state endpoints.

#### Scenario: Action-style auth routes are available
- **WHEN** a first-party client integrates with the backend authentication helpers
- **THEN** the available routes include explicit actions such as `/api/auth/login`, `/api/auth/change-password`, `/api/auth/refresh`, `/api/auth/logout`, and `/api/auth/me`

### Requirement: Development environments SHALL expose Swagger for first-party auth helpers
The system SHALL expose Swagger/OpenAPI documentation in `Development` so the authentication helper endpoints can be explored locally, and SHALL keep Swagger disabled outside `Development`.

#### Scenario: Swagger is available in Development
- **WHEN** the service runs in `Development`
- **THEN** the Swagger/OpenAPI document includes the first-party authentication helper endpoints and bearer-auth metadata for protected APIs

#### Scenario: Swagger is unavailable outside Development
- **WHEN** the service runs outside `Development`
- **THEN** the Swagger/OpenAPI endpoints are not exposed
