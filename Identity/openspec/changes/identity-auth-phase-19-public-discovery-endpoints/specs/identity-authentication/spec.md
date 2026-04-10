## MODIFIED Requirements

### Requirement: Identity SHALL publish public OIDC discovery endpoints
The Identity service SHALL publish OIDC discovery metadata using the configured public issuer base URI instead of infrastructure gateway hosts.

#### Scenario: Discovery is requested through an internal or proxy host
- **WHEN** a client requests `/.well-known/openid-configuration`
- **THEN** the `issuer` value SHALL equal the configured `Oidc:Issuer`
- **AND** `authorization_endpoint` SHALL equal `{Oidc:Issuer}/connect/authorize`
- **AND** `token_endpoint` SHALL equal `{Oidc:Issuer}/connect/token`
- **AND** `end_session_endpoint` SHALL equal `{Oidc:Issuer}/connect/logout`
- **AND** `jwks_uri` SHALL equal `{Oidc:Issuer}/.well-known/jwks`

#### Scenario: Server route matching remains proxy-safe
- **WHEN** OpenIddict endpoint routes are registered
- **THEN** the authorization, token, and end-session endpoint route paths SHALL remain relative route paths
- **AND** route matching SHALL NOT depend on absolute public issuer URLs.
