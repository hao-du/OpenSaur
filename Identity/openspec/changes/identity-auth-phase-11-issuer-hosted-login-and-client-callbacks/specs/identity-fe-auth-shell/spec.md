## MODIFIED Requirements

### Requirement: First-party frontend SHALL use issuer-hosted auth with host-appropriate session completion

The first-party frontend SHALL start authorization against the configured issuer and SHALL use only exact redirect URI(s) registered for the shared first-party client when the current host is not the configured issuer. The frontend MAY derive the current host's callback candidate from the active browser origin, but the flow SHALL succeed only when that callback matches a registered URI. When the current host equals the configured issuer, the frontend SHALL reuse the issuer-hosted ASP.NET Identity cookie directly for authenticated `/api/auth/*` access instead of running an authorization-code callback exchange against itself.

#### Scenario: Hosted auth shell starts authorization with configured issuer and registered callback

- **WHEN** a non-issuer first-party host starts a browser authorization request
- **THEN** the authorize URL targets the configured issuer
- **AND** the request uses a registered redirect URI for the current host on the shared first-party client

#### Scenario: Hosted auth shell reads issuer settings from backend-served runtime config

- **WHEN** the first-party shell bootstraps in the browser
- **THEN** the current host serves the issuer authority, first-party client id, scopes, callback URI, and issuer-hosted-mode flag through runtime configuration
- **AND** the built frontend bundle does not rely on deployment-specific hostname defaults to decide where auth should start

#### Scenario: Non-issuer callback completes backend-assisted exchange successfully

- **WHEN** a non-issuer first-party host receives a valid authorization callback on its registered callback route
- **THEN** the frontend posts the authorization `code` to the backend web-session exchange endpoint
- **AND** the backend returns a JWT access token payload to the frontend
- **AND** the backend stores the refresh token in a secure `httpOnly` cookie instead of returning it to browser JavaScript

#### Scenario: Issuer-hosted shell reuses the issuer cookie directly

- **WHEN** the first-party shell is running on the configured issuer host
- **THEN** protected-session bootstrap uses the issuer cookie through authenticated `/api/auth/*` helpers
- **AND** the frontend does not self-start `/connect/authorize` or `/api/auth/web-session/exchange` for ordinary hosted sign-in

#### Scenario: Impersonation triggers a full issuer/browser redirect flow

- **WHEN** the first-party frontend starts or exits impersonation
- **THEN** the frontend requests an issuer redirect URL from the backend instead of expecting replacement access tokens directly
- **AND** the browser performs a full-page navigation to the issuer-hosted impersonation bridge
- **AND** the updated session returns either through the normal authorization callback route for non-issuer hosts or directly back to the hosted issuer shell route when the shell is running on the issuer host

#### Scenario: Issuer handoff states render with the current host's cached preferences

- **WHEN** the first-party frontend renders issuer-handoff, callback, or exchange-failure retry states on a given host
- **THEN** the UI uses that host's cached locale/time-zone preferences instead of hard-coded English copy
- **AND** after a successful callback the frontend synchronizes `/api/auth/settings` back into that same host's preference cache for later handoff screens
