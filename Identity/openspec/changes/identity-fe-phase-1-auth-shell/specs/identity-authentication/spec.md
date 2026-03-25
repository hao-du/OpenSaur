## MODIFIED Requirements

### Requirement: First-party web SHALL use the same OpenIddict authorization code flow as other clients
The system SHALL support the first-party web client as an OpenIddict client that uses the authorization code flow to obtain JWT access tokens and rotating refresh tokens, instead of a separate custom login/refresh/logout API. The first-party frontend SHALL complete the callback flow on a same-host frontend route, SHALL receive the resulting JWT access token for FE API use, SHALL keep the access token in memory only, and SHALL rely on a backend-managed `httpOnly` refresh token cookie for refresh operations. The first-party frontend SHALL attempt token refresh before expiry when the backend still accepts the session, SHALL redirect the user back to the previously requested route after successful login/callback completion, and SHALL return the user to login when no valid access/refresh path remains.

#### Scenario: First-party client exchanges authorization code
- **WHEN** the first-party client completes a successful authorization code flow
- **THEN** the system returns a JWT access token and rotating refresh token for that client through the token endpoint

#### Scenario: First-party client refreshes tokens
- **WHEN** the first-party client presents a valid refresh token at the token endpoint
- **THEN** the system returns a new JWT access token, rotates the refresh token, and rejects reuse of the redeemed refresh token

#### Scenario: First-party client refreshes before token expiry
- **WHEN** the first-party frontend detects that the current access token is approaching expiry and the backend still accepts the refresh/session path
- **THEN** the first-party client obtains a replacement access token without requiring the user to log in again

#### Scenario: First-party bootstrap fails after session expiry
- **WHEN** the first-party client attempts to bootstrap the current session and no valid access/refresh path remains
- **THEN** the system returns an authentication failure that allows the client to redirect the user back to login

#### Scenario: First-party login returns the user to the original route
- **WHEN** the first-party user completes login and callback handling after being redirected away from a protected route
- **THEN** the first-party client restores the user to the previously requested route instead of leaving the user on the login or callback page
