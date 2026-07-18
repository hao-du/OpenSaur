## MODIFIED Requirements

### Requirement: Umbraco backoffice SHALL authenticate through the configured Identity issuer
The Umbraco backoffice SHALL use a configured OpenID Connect external login provider so that backoffice sign-in is delegated to the configured Identity issuer instead of a local Umbraco username/password prompt.

#### Scenario: Mounted backoffice shell loads successfully
- **WHEN** a developer navigates to the mounted backoffice route such as `/cms/umbraco`
- **THEN** the Umbraco shell HTML SHALL load successfully
- **AND** the required backoffice CSS and JavaScript assets SHALL resolve without 404 responses

#### Scenario: Mounted backoffice uses the configured mounted path
- **WHEN** the backoffice shell is rendered under a configured mount such as `/cms/umbraco`
- **THEN** the frontend shell SHALL know the mounted backoffice path
- **AND** it SHALL use that mounted backoffice path for its own route handling
