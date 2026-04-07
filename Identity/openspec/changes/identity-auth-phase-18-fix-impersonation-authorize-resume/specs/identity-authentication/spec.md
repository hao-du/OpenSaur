## MODIFIED Requirements

### Requirement: First-party impersonation flows SHALL resume the correct post-login target
The system SHALL preserve and resume the intended post-login target for issuer-hosted and non-issuer first-party clients when impersonation starts or exits.

#### Scenario: Localhost client impersonation resumes authorization successfully
- **WHEN** a super administrator starts impersonation from a localhost first-party client
- **AND** the issuer resumes the pending authorization request for that client
- **THEN** the issuer completes `/connect/authorize` without a server error
- **AND** the browser is redirected back to the registered localhost client callback with an authorization code
