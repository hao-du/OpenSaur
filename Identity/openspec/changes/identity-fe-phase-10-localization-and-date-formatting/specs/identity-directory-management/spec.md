## MODIFIED Requirements

### Requirement: Directory management APIs SHALL return the common application JSON envelope
The system SHALL return the common application JSON envelope for `/api/user/*`, `/api/role/*`, `/api/user-role/*`, and `/api/workspace/*` endpoints. Successful operations SHALL return `200 OK` with `success = true`, a JSON `data` value or `null`, and an empty `errors` array. Expected business failures SHALL be represented through the application result pattern and converted into the common envelope. Unexpected exceptions SHALL be normalized centrally into the same failure envelope instead of being handled ad hoc in each endpoint. Failed operations SHALL return `success = false`, `data = null`, and an `errors` array whose items contain stable string `code`, English `message`, and English `detail` values so the hosted frontend can localize known failures without matching raw backend message text.

#### Scenario: Directory create or edit succeeds
- **WHEN** an authorized caller completes a successful create, edit, password-reset, or workspace-reassignment operation through a directory-management endpoint
- **THEN** the system returns `200 OK` with the common success envelope instead of `201 Created` or `204 NoContent`

#### Scenario: Directory lookup succeeds
- **WHEN** an authorized caller retrieves users, roles, user-role assignments, or workspaces
- **THEN** the system returns `200 OK` with the common success envelope and the requested payload in `data`

#### Scenario: Directory request fails
- **WHEN** a directory-management request fails because of validation, authorization, not-found, conflict, or an unexpected server exception
- **THEN** the system returns the common failure envelope and does not expose raw `ProblemDetails` or inconsistent ad hoc JSON shapes

#### Scenario: Expected directory failure returns a stable code
- **WHEN** a directory-management request fails for an expected business reason
- **THEN** the common failure envelope includes a stable error `code` value suitable for frontend localization
- **AND** the envelope still includes English backend `message` and `detail` values as fallback diagnostics
