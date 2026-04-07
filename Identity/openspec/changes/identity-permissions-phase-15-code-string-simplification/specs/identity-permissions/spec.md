## MODIFIED Requirements

### Requirement: Permission catalog SHALL use canonical string codes and display-friendly metadata
The system SHALL store permissions with a stable canonical string `Code`, a display-friendly `Name`, a human-readable `Description`, `Rank`, `PermissionScopeId`, and the standard audit columns. The system SHALL NOT require a separate numeric `CodeId` for permission identity.

#### Scenario: Permission is stored for user selection
- **WHEN** the system persists or returns a permission record
- **THEN** the record includes canonical string `Code`, display-friendly `Name`, `Description`, `Rank`, `PermissionScopeId`, and audit metadata suitable for administrator selection workflows

### Requirement: Permission definitions SHALL map database records by canonical string code
The system SHALL maintain a code-owned permission catalog that maps each canonical permission `Code` to its `PermissionScopeId` and rank metadata used by authorization logic.

#### Scenario: Authorization resolves canonical permission metadata
- **WHEN** the system evaluates a permission assignment by canonical permission `Code`
- **THEN** it resolves the canonical permission metadata from the code-owned catalog before making an authorization decision

### Requirement: Role permissions SHALL be assignable by canonical permission code
The system SHALL allow roles to be assigned permissions through role-permission records that reference permission definitions identified by canonical string `Code`.

#### Scenario: Role is assigned a permission
- **WHEN** an authorized administrator assigns a permission to a role
- **THEN** the system stores a role-permission record that links the role to the selected permission definition identified by canonical string `Code`

### Requirement: Permission hierarchy SHALL imply lower permissions within a scope
The system SHALL treat higher-ranked permissions in the same `PermissionScopeId` as implying all lower-ranked permissions in that same scope.

#### Scenario: Higher-ranked permission implies lower-ranked permissions in the same scope
- **WHEN** a user is granted a role that includes a higher-ranked permission within a scope
- **THEN** the system also treats that user as having all lower-ranked permissions in that same scope

#### Scenario: Permission implication does not cross scopes
- **WHEN** a user is granted a permission in one scope
- **THEN** the system does not imply permissions from any different scope

### Requirement: Administrative authorization SHALL combine roles and permissions
The system SHALL use role assignment, workspace scope, and resolved permission implication to authorize management endpoints.

#### Scenario: Permission-enabled administrator performs allowed action
- **WHEN** a same-workspace administrator has a role that resolves to the required canonical permission code
- **THEN** the system authorizes the action

#### Scenario: Missing permission blocks action
- **WHEN** a caller does not resolve to the required canonical permission code for an action
- **THEN** the system rejects the action even if the caller is otherwise authenticated

### Requirement: Default permission seed SHALL contain only the active built-in administrator permission
The system SHALL seed only the active built-in administrator permission definitions that remain supported by the application catalog.

#### Scenario: Obsolete built-in permission is removed
- **WHEN** the system applies the permission-model migration for this slice
- **THEN** the obsolete built-in `Administrator.CanView` permission is removed from the supported catalog and persisted seed data expectations
