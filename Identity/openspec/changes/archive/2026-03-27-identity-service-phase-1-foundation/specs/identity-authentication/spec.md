## ADDED Requirements

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
- **WHEN** a caller without a valid API bearer token invokes the logout API
- **THEN** the system rejects the request instead of clearing the hosted session

### Requirement: First-party web SHALL use the same OpenIddict authorization code flow as other clients
The system SHALL support the first-party web client as an OpenIddict client that uses the authorization code flow to obtain JWT access tokens and rotating refresh tokens, instead of a separate custom login/refresh/logout API.

#### Scenario: First-party client exchanges authorization code
- **WHEN** the first-party client completes a successful authorization code flow
- **THEN** the system returns a JWT access token and rotating refresh token for that client through the token endpoint

#### Scenario: First-party client refreshes tokens
- **WHEN** the first-party client presents a valid refresh token at the token endpoint
- **THEN** the system returns a new JWT access token, rotates the refresh token, and rejects reuse of the redeemed refresh token

#### Scenario: First-party bootstrap fails after session expiry
- **WHEN** the first-party client attempts to bootstrap the current session and no valid access/refresh path remains
- **THEN** the system returns an authentication failure that allows the client to redirect the user back to login

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
- **THEN** the explicit account routes include `/api/auth/login`, `/api/auth/logout`, `/api/auth/change-password`, and `/api/auth/me`, while `/connect/authorize` and `/connect/token` handle shared authentication/token flow

#### Scenario: Self-service password change stays separate from admin reset
- **WHEN** a signed-in user changes their own password through the account helper APIs
- **THEN** the system uses `/api/auth/change-password` for self-service password rotation, while administrator-initiated password resets remain part of the user-management API surface

#### Scenario: Authorization requests redirect to the FE login route
- **WHEN** an anonymous browser starts an authorization request at `/connect/authorize`
- **THEN** the system redirects the browser to the FE login route with a `returnUrl` that the FE can navigate back to after a successful API login

### Requirement: `/api/auth/*` helpers SHALL return the common application JSON envelope
The system SHALL return a common JSON response envelope for `/api/auth/*` helper endpoints, where successful responses contain `success`, `data`, and `errors`, and failed responses normalize validation, authorization, and unexpected exception paths into the same shape. Expected authentication helper failures SHALL be represented through the application result pattern and converted into the common envelope, while unexpected exceptions SHALL be normalized centrally instead of requiring handler-local `try/catch` blocks. OIDC protocol endpoints under `/connect/*` SHALL remain standards-compliant and SHALL NOT be wrapped in the application envelope.

#### Scenario: Auth helper succeeds without a payload
- **WHEN** an `/api/auth/*` helper operation succeeds without a domain payload, such as login, logout, or password change
- **THEN** the system returns `200 OK` with `success = true`, `data = null`, and an empty `errors` array

#### Scenario: Auth helper fails with a normalized error envelope
- **WHEN** an `/api/auth/*` helper request fails because of invalid credentials, authorization, validation, or an unexpected server exception
- **THEN** the system returns a failure response whose `errors` array contains one or more items with string `code`, `message`, and `detail` fields

### Requirement: Development environments SHALL expose Swagger for first-party auth helpers
The system SHALL expose Swagger/OpenAPI documentation in `Development` so the authentication helper endpoints can be explored locally, and SHALL keep Swagger disabled outside `Development`.

#### Scenario: Swagger is available in Development
- **WHEN** the service runs in `Development`
- **THEN** the Swagger/OpenAPI document includes the protected account-management endpoints and bearer-auth metadata for protected APIs

#### Scenario: Swagger is unavailable outside Development
- **WHEN** the service runs outside `Development`
- **THEN** the Swagger/OpenAPI endpoints are not exposed
