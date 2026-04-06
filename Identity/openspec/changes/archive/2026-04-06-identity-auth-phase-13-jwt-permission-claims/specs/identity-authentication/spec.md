## MODIFIED Requirements

### Requirement: Third-party clients SHALL use OpenIddict authorization code flow
The system SHALL act as an OpenIddict authorization server for third-party clients and SHALL issue client-bound authorization codes, JWT access tokens, and rotating refresh tokens through the authorization code flow.

#### Scenario: Third-party client exchanges authorization code
- **WHEN** a registered third-party client exchanges a valid authorization code at the token endpoint
- **THEN** the system returns a client-bound JWT access token and rotating refresh token for that client
- **AND** the access token includes repeated `permissions` claims containing canonical effective permission codes when the granted scope includes `api`

#### Scenario: Third-party client refreshes tokens
- **WHEN** a registered third-party client presents a valid refresh token at the token endpoint
- **THEN** the system issues a new JWT access token, rotates the refresh token, and rejects reuse of the redeemed refresh token

### Requirement: First-party web SHALL use the configured issuer as the source of trust for browser auth

The system SHALL authenticate the first-party browser shell through the configured issuer instead of assuming the current browser host owns credential entry. The shared first-party client SHALL use only exact registered redirect URI(s), SHALL send authorization requests to the configured issuer from non-issuer hosts, and SHALL receive authorization responses only at a redirect URI registered for that client. First-party hosts MAY continue to use backend-assisted authorization-code exchange and refresh-cookie handling, but that token custody SHALL remain scoped to the host that owns the registered callback URI. When the first-party shell is running on the issuer host itself, the shell SHALL reuse the issuer-hosted ASP.NET Identity cookie directly for `/api/auth/*` access instead of running the authorization-code callback exchange against itself.

#### Scenario: Issuer-hosted shell session enrichment includes effective permission claims
- **WHEN** the first-party shell is running on the configured issuer host and a valid issuer login session is transformed into the application principal used by `/api/auth/*`
- **THEN** the resulting authenticated principal includes repeated `permissions` claims containing canonical effective permission codes for the current workspace and impersonation context
