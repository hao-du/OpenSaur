## MODIFIED Requirements

### Requirement: First-party web SHALL use the same OpenIddict authorization code flow as other clients

The system SHALL authenticate the first-party browser shell through the issuer-hosted OpenIddict authorization code flow instead of assuming the current browser host owns credential entry. The shared first-party client SHALL use only exact registered redirect URI(s), SHALL send authorization requests to the configured issuer, and SHALL receive authorization responses only at a redirect URI registered for that client. First-party hosts MAY continue to use backend-assisted authorization-code exchange and refresh-cookie handling, but that token custody SHALL remain scoped to the host that owns the registered callback URI.

#### Scenario: Anonymous browser client is redirected to issuer-hosted login

- **WHEN** an anonymous user starts an authorization request from a registered browser client and no reusable hosted session exists
- **THEN** the system presents credential entry on the issuer host instead of requiring the requesting app host to collect credentials itself
- **AND** after successful authentication the issuer continues the authorization code flow for that requesting client

#### Scenario: Existing hosted session is reused across registered callback URIs

- **WHEN** a user with a valid hosted identity session starts a new authorization request for another registered callback URI on the shared first-party client
- **THEN** the system reuses the hosted session and returns the authorization response to that registered callback URI without requiring new credential entry unless policy requires it

#### Scenario: Authorization request with an unregistered redirect URI is rejected

- **WHEN** a first-party host sends an authorization request with a redirect URI that is not registered for the shared first-party client
- **THEN** the system rejects the request instead of redirecting the browser to that unregistered URI

#### Scenario: Impersonation re-enters the issuer-backed authorization flow

- **WHEN** a user starts or exits impersonation from a first-party host
- **THEN** the system updates the issuer-hosted authentication session on the issuer host first
- **AND** the browser is redirected through the standard authorization-code flow back to the requesting host's registered callback URI
- **AND** the local impersonation endpoint does not mint replacement session tokens directly
