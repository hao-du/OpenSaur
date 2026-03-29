## MODIFIED Requirements

### Requirement: First-party web SHALL use the same OpenIddict authorization code flow as other clients
The system SHALL support the first-party web client as an OpenIddict client that uses the authorization code flow, while keeping first-party browser token handling backend-assisted. The first-party frontend SHALL complete the callback flow on a same-host frontend route, SHALL send the authorization `code` to a first-party backend web-session exchange endpoint, SHALL receive the resulting JWT access token for FE API use, SHALL keep the access token in memory only, and SHALL rely on a backend-managed `httpOnly` refresh token cookie for refresh operations. The first-party frontend SHALL attempt token refresh before expiry through a first-party backend refresh endpoint, SHALL redirect the user back to the previously requested route after successful login/callback completion, SHALL return the user to login when no valid access/refresh path remains, and SHALL support backend-assisted impersonation start/exit flows that return replacement first-party tokens for the new effective session. Third-party clients SHALL continue to use the standard authorization-code and token endpoints directly.

#### Scenario: Impersonation start returns replacement first-party tokens
- **WHEN** an authenticated `SuperAdministrator` successfully starts impersonation
- **THEN** the backend returns a replacement JWT access token to the first-party frontend
- **AND** the backend rotates the refresh-token cookie for the impersonated session
- **AND** future refresh operations continue under the impersonated identity until impersonation ends or logout occurs

#### Scenario: Impersonation exit restores the original first-party session
- **WHEN** an authenticated impersonated session exits impersonation successfully
- **THEN** the backend returns a replacement JWT access token for the original `SuperAdministrator`
- **AND** the backend rotates the refresh-token cookie back to the restored session
- **AND** future refresh operations continue under the restored super-admin identity

### Requirement: Account management helpers SHALL use explicit action routes
The system SHALL expose non-protocol account-management helper endpoints using explicit action-style routes, and those custom endpoints SHALL accept JSON request bodies instead of HTML form posts. Browser redirects SHALL be owned by the FE, while OIDC protocol endpoints continue to perform the redirects required by the standard authorization flow.

#### Scenario: Action-style account routes are available
- **WHEN** a first-party client integrates with the backend account helpers
- **THEN** the explicit account routes include `/api/auth/login`, `/api/auth/logout`, `/api/auth/change-password`, `/api/auth/me`, `/api/auth/impersonation/options/{workspaceId}`, `/api/auth/impersonation/start`, and `/api/auth/impersonation/exit`, while `/connect/authorize` and `/connect/token` handle shared authentication/token flow

### Requirement: `/api/auth/*` helpers SHALL return the common application JSON envelope
The system SHALL return a common JSON response envelope for `/api/auth/*` helper endpoints, where successful responses contain `success`, `data`, and `errors`, and failed responses normalize validation, authorization, and unexpected exception paths into the same shape. Expected authentication helper failures SHALL be represented through the application result pattern and converted into the common envelope, while unexpected exceptions SHALL be normalized centrally instead of requiring handler-local `try/catch` blocks. OIDC protocol endpoints under `/connect/*` SHALL remain standards-compliant and SHALL NOT be wrapped in the application envelope.

#### Scenario: Current-user helper includes impersonation context
- **WHEN** an authenticated caller reads `/api/auth/me`
- **THEN** the response includes whether impersonation is active
- **AND** the response includes the effective workspace name shown by the hosted shell
- **AND** the response continues to include the effective user identity, roles, and password-change state
