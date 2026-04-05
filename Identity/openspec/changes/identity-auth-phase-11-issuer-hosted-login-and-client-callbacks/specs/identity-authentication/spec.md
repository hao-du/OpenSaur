## MODIFIED Requirements

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
