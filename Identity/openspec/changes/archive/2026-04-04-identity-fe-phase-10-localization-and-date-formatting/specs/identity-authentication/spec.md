## MODIFIED Requirements

### Requirement: `/api/auth/*` helpers SHALL return the common application JSON envelope
The system SHALL return a common JSON response envelope for `/api/auth/*` helper endpoints, where successful responses contain `success`, `data`, and `errors`, and failed responses normalize validation, authorization, and unexpected exception paths into the same shape. Expected authentication helper failures SHALL be represented through the application result pattern and converted into the common envelope, while unexpected exceptions SHALL be normalized centrally instead of requiring handler-local `try/catch` blocks. OIDC protocol endpoints under `/connect/*` SHALL remain standards-compliant and SHALL NOT be wrapped in the application envelope. For expected auth-helper failures, the envelope SHALL include stable error `code` values that the hosted frontend can translate independently of the English backend message text.

#### Scenario: Current-user helper includes hosted user-management capability
- **WHEN** an authenticated caller reads `/api/auth/me`
- **THEN** the response includes whether the current session can access the hosted `Users` page
- **AND** that capability already accounts for workspace scope, effective permissions, and the special `Personal` workspace rule
- **AND** the response continues to include the effective user identity, roles, workspace display name, impersonation state, and password-change state

#### Scenario: Expected auth-helper failure returns a stable code
- **WHEN** an expected auth-helper request fails because of validation, authorization, or business-rule enforcement
- **THEN** the common failure envelope includes a stable error `code` value suitable for frontend localization
- **AND** the envelope still includes English backend message/detail text as fallback diagnostics
