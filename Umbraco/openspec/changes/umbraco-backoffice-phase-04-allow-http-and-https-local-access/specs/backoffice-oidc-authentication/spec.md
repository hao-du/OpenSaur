## MODIFIED Requirements

### Requirement: Umbraco backoffice SHALL authenticate through the configured Identity issuer
The Umbraco backoffice SHALL use a configured OpenID Connect external login provider so that backoffice sign-in is delegated to the configured Identity issuer instead of a local Umbraco username/password prompt.

#### Scenario: Local development access does not force HTTPS
- **WHEN** a developer navigates to the local Umbraco app over `http://localhost`
- **THEN** the app SHALL serve the mounted `/cms` route without automatically redirecting the request to HTTPS
- **AND** the equivalent HTTPS local route SHALL remain available
