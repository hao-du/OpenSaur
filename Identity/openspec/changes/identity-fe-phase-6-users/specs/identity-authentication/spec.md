## MODIFIED Requirements

### Requirement: `/api/auth/*` helpers SHALL return the common application JSON envelope
The system SHALL return a common JSON response envelope for `/api/auth/*` helper endpoints, where successful responses contain `success`, `data`, and `errors`, and failed responses normalize validation, authorization, and unexpected exception paths into the same shape. Expected authentication helper failures SHALL be represented through the application result pattern and converted into the common envelope, while unexpected exceptions SHALL be normalized centrally instead of requiring handler-local `try/catch` blocks. OIDC protocol endpoints under `/connect/*` SHALL remain standards-compliant and SHALL NOT be wrapped in the application envelope.

#### Scenario: Current-user helper includes hosted user-management capability
- **WHEN** an authenticated caller reads `/api/auth/me`
- **THEN** the response includes whether the current session can access the hosted `Users` page
- **AND** that capability already accounts for workspace scope, effective permissions, and the special `Personal` workspace rule
- **AND** the response continues to include the effective user identity, roles, workspace display name, impersonation state, and password-change state
