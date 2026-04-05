## MODIFIED Requirements

### Requirement: Frontend auth-only phase SHALL expose the minimal route set
The first frontend phase SHALL expose an auth-only route set consisting of `/login`, `/auth/callback`, `/change-password`, and one protected shell route.

#### Scenario: Frontend-integrated downstream clients can trust permission claims from the issuer access token
- **WHEN** a non-issuer first-party shell or downstream client receives an access token from the shared issuer with the `api` scope
- **THEN** the token contains repeated `permissions` claims with canonical permission-code strings
- **AND** the client does not need direct Identity database access to evaluate those permissions
