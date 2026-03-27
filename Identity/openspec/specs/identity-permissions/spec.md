# identity-permissions Specification

## Purpose
TBD - created by archiving change identity-service-phase-1-foundation. Update Purpose after archive.
## Requirements
### Requirement: Permission catalog SHALL use stable code identifiers and display-friendly metadata
The system SHALL store permissions with a stable integer `CodeId`, a display-friendly `Name`, a human-readable `Description`, and the standard audit columns, while the canonical permission code remains defined in application code.

#### Scenario: Permission is stored for user selection
- **WHEN** the system persists or returns a permission record
- **THEN** the record includes `CodeId`, display-friendly `Name`, `Description`, and audit metadata suitable for administrator selection workflows

### Requirement: Permission scopes SHALL be first-class records for UI lookup
The system SHALL maintain a code-defined set of permission scopes and persist them as auditable app-owned records so API clients can render and group permissions by scope.

#### Scenario: Scope is returned for UI lookup
- **WHEN** an authorized client requests permission scope data
- **THEN** the system returns first-class scope records with identifiers and display metadata suitable for grouping permissions in the UI

### Requirement: Permission definitions SHALL map database records to code-owned metadata
The system SHALL maintain a code-owned permission catalog that maps each `CodeId` to a canonical permission code, `PermissionScopeId`, and rank metadata used by authorization logic.

#### Scenario: Authorization resolves canonical permission metadata
- **WHEN** the system evaluates a permission assignment by `CodeId`
- **THEN** it resolves the canonical permission metadata from the code-owned catalog before making an authorization decision

### Requirement: Role permissions SHALL be assignable by permission code identifier
The system SHALL allow roles to be assigned permissions through role-permission records that reference permission definitions by stable identity.

#### Scenario: Role is assigned a permission
- **WHEN** an authorized administrator assigns a permission to a role
- **THEN** the system stores a role-permission record that links the role to the selected permission definition

### Requirement: Permission hierarchy SHALL imply lower permissions within a scope
The system SHALL treat higher-ranked permissions in the same `PermissionScopeId` as implying all lower-ranked permissions in that same scope.

#### Scenario: Higher-ranked permission implies lower-ranked permissions in the same scope
- **WHEN** a user is granted a role that includes a higher-ranked permission within a scope
- **THEN** the system also treats that user as having all lower-ranked permissions in that same scope

#### Scenario: Mid-ranked permission does not imply higher permissions in the same scope
- **WHEN** a user is granted a role that includes a mid-ranked permission within a scope
- **THEN** the system treats that user as having the lower-ranked permissions in that same scope but not the higher-ranked permissions

#### Scenario: Permission implication does not cross scopes
- **WHEN** a user is granted a permission in one scope
- **THEN** the system does not imply permissions from any different scope

### Requirement: Administrative authorization SHALL combine roles and permissions
The system SHALL use role assignment, workspace scope, and resolved permission implication to authorize management endpoints.

#### Scenario: Permission-enabled administrator performs allowed action
- **WHEN** a same-workspace administrator has a role that resolves to the required permission
- **THEN** the system authorizes the action

#### Scenario: Missing permission blocks action
- **WHEN** a caller does not resolve to the required permission for an action
- **THEN** the system rejects the action even if the caller is otherwise authenticated

### Requirement: Permission APIs SHALL return the common application JSON envelope
The system SHALL return the common application JSON envelope for `/api/permission/*` and `/api/permission-scope/*` endpoints. Successful permission and scope lookups SHALL return `200 OK` with `success = true`, the payload in `data`, and an empty `errors` array. Expected permission-related failures SHALL be represented through the application result pattern and converted into the envelope, while unexpected exceptions SHALL be normalized centrally into the same failure envelope format.

#### Scenario: Permission lookup succeeds
- **WHEN** an authorized client retrieves permission or permission-scope data
- **THEN** the system returns `200 OK` with the common success envelope and the lookup payload in `data`

#### Scenario: Permission lookup fails
- **WHEN** a permission-related API request fails because of authorization, validation, not-found, or an unexpected exception
- **THEN** the system returns the common failure envelope with `errors` items that each contain string `code`, `message`, and `detail` fields

