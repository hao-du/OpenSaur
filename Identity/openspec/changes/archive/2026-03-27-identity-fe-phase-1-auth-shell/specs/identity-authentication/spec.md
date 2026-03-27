## MODIFIED Requirements

### Requirement: First-party web SHALL use the same OpenIddict authorization code flow as other clients
The system SHALL support the first-party web client as an OpenIddict client that uses the authorization code flow, while keeping first-party browser token handling backend-assisted. The first-party frontend SHALL complete the callback flow on a same-host frontend route, SHALL send the authorization `code` to a first-party backend web-session exchange endpoint, SHALL receive the resulting JWT access token for FE API use, SHALL keep the access token in memory only, and SHALL rely on a backend-managed `httpOnly` refresh token cookie for refresh operations. The first-party frontend SHALL attempt token refresh before expiry through a first-party backend refresh endpoint, SHALL redirect the user back to the previously requested route after successful login/callback completion, and SHALL return the user to login when no valid access/refresh path remains. Third-party clients SHALL continue to use the standard authorization-code and token endpoints directly.

#### Scenario: First-party client exchanges authorization code through backend assistance
- **WHEN** the first-party frontend completes a successful authorization code flow
- **THEN** the frontend sends the authorization `code` to the backend web-session exchange endpoint
- **AND** the backend exchanges the code through the token endpoint on behalf of the first-party client
- **AND** the backend returns a JWT access token to the frontend
- **AND** the backend stores the rotating refresh token in a secure `httpOnly` cookie

#### Scenario: First-party client refreshes tokens through backend assistance
- **WHEN** the first-party frontend calls the backend refresh endpoint and a valid refresh-token cookie is present
- **THEN** the backend presents that refresh token to the token endpoint
- **AND** the system returns a new JWT access token
- **AND** the backend rotates the refresh-token cookie and rejects reuse of the redeemed refresh token

#### Scenario: First-party client refreshes before token expiry
- **WHEN** the first-party frontend detects that the current access token is approaching expiry and the backend still accepts the refresh/session path
- **THEN** the first-party client obtains a replacement access token without requiring the user to log in again

#### Scenario: Third-party client continues to use the standard token endpoint
- **WHEN** a non-first-party OpenIddict client completes a successful authorization code flow
- **THEN** that third-party client exchanges the authorization code directly through the token endpoint using the standard OIDC client contract

#### Scenario: First-party bootstrap fails after session expiry
- **WHEN** the first-party client attempts to bootstrap the current session and no valid access/refresh path remains
- **THEN** the system returns an authentication failure that allows the client to redirect the user back to login

#### Scenario: First-party login returns the user to the original route
- **WHEN** the first-party user completes login and callback handling after being redirected away from a protected route
- **THEN** the first-party client restores the user to the previously requested route instead of leaving the user on the login or callback page
