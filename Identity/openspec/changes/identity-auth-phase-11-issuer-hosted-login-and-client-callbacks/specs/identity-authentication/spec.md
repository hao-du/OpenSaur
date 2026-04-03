## MODIFIED Requirements

### Requirement: First-party web SHALL use the same OpenIddict authorization code flow as other clients

The system SHALL authenticate first-party browser clients through the issuer-hosted OpenIddict authorization code flow instead of assuming the current browser host owns credential entry. Each browser client SHALL be registered with its own exact redirect URI(s), SHALL send authorization requests to the configured issuer, and SHALL receive authorization responses only at the redirect URI registered for that client. First-party clients MAY continue to use backend-assisted authorization-code exchange and refresh-cookie handling, but that token custody SHALL remain scoped to the client application that owns the registered callback URI.

#### Scenario: Anonymous browser client is redirected to issuer-hosted login

- **WHEN** an anonymous user starts an authorization request from a registered browser client and no reusable hosted session exists
- **THEN** the system presents credential entry on the issuer host instead of requiring the requesting app host to collect credentials itself
- **AND** after successful authentication the issuer continues the authorization code flow for that requesting client

#### Scenario: Existing hosted session is reused across registered browser clients

- **WHEN** a user with a valid hosted identity session starts a new authorization request for another registered browser client
- **THEN** the system reuses the hosted session and returns the authorization response to that client's registered callback URI without requiring new credential entry unless policy requires it

#### Scenario: Authorization request with an unregistered redirect URI is rejected

- **WHEN** a browser client sends an authorization request with a redirect URI that is not registered for that client
- **THEN** the system rejects the request instead of redirecting the browser to that unregistered URI
