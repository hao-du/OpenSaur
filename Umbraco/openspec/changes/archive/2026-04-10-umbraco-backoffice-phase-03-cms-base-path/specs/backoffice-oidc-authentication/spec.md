## MODIFIED Requirements

### Requirement: Umbraco backoffice SHALL authenticate through the configured Identity issuer
The Umbraco backoffice SHALL use a configured OpenID Connect external login provider so that backoffice sign-in is delegated to the configured Identity issuer instead of a local Umbraco username/password prompt.

#### Scenario: Backoffice login starts from the configured app base path
- **WHEN** the Umbraco app is configured with an application base path such as `/cms`
- **THEN** the backoffice SHALL be reachable under that base path
- **AND** an unauthenticated user navigating to the backoffice SHALL still be redirected to the configured Identity issuer login flow

#### Scenario: Callback path inherits the configured app base path
- **WHEN** the Umbraco app is configured with an application base path such as `/cms`
- **THEN** the OpenID Connect callback URI SHALL be generated under that base path
- **AND** the signed-out callback URI SHALL be generated under that base path

#### Scenario: Callback path is reserved for OIDC handling
- **WHEN** the issuer redirects back to the Umbraco callback path
- **THEN** Umbraco SHALL treat that callback path as reserved infrastructure routing
- **AND** it SHALL NOT resolve the callback request as website content
