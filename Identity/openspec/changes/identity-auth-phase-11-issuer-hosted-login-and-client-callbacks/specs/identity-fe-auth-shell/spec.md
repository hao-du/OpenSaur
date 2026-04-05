## MODIFIED Requirements

### Requirement: First-party frontend SHALL receive JWT access tokens through a backend-assisted web-session exchange

The first-party frontend SHALL start authorization against the configured issuer and SHALL use only exact redirect URI(s) registered for the shared first-party client. The frontend MAY derive the current host's callback candidate from the active browser origin, but the flow SHALL succeed only when that callback matches a registered URI. After the registered callback route receives a valid authorization `code`, the frontend SHALL continue to send that `code` to the backend web-session exchange endpoint and SHALL receive a JWT access token for authenticated API access without receiving the refresh token in browser JavaScript.

#### Scenario: Hosted auth shell starts authorization with configured issuer and registered callback

- **WHEN** the hosted first-party auth shell starts a browser authorization request
- **THEN** the authorize URL targets the configured issuer
- **AND** the request uses a registered redirect URI for the current host on the shared first-party client

#### Scenario: Registered callback completes backend-assisted exchange successfully

- **WHEN** the frontend receives a valid first-party authorization callback on the registered callback route
- **THEN** the frontend posts the authorization `code` to the backend web-session exchange endpoint
- **AND** the backend returns a JWT access token payload to the frontend
- **AND** the backend stores the refresh token in a secure `httpOnly` cookie instead of returning it to browser JavaScript

#### Scenario: Impersonation triggers a full issuer/browser redirect flow

- **WHEN** the first-party frontend starts or exits impersonation
- **THEN** the frontend requests an issuer redirect URL from the backend instead of expecting replacement access tokens directly
- **AND** the browser performs a full-page navigation to the issuer-hosted impersonation bridge
- **AND** the updated session returns through the normal authorization callback route and backend-assisted web-session exchange

#### Scenario: Issuer handoff states render with the current host's cached preferences

- **WHEN** the first-party frontend renders issuer-handoff, callback, or exchange-failure retry states on a given host
- **THEN** the UI uses that host's cached locale/time-zone preferences instead of hard-coded English copy
- **AND** after a successful callback the frontend synchronizes `/api/auth/settings` back into that same host's preference cache for later handoff screens
