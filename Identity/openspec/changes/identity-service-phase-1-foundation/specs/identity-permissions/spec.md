## ADDED Requirements

### Requirement: Permission catalog SHALL use stable code identifiers and display-friendly metadata
The system SHALL store permissions with a stable integer `CodeId`, a display-friendly `Name`, a human-readable `Description`, and the standard audit columns, while the canonical permission code remains defined in application code.

#### Scenario: Permission is stored for user selection
- **WHEN** the system persists or returns a permission record
- **THEN** the record includes `CodeId`, display-friendly `Name`, `Description`, and audit metadata suitable for administrator selection workflows

### Requirement: Permission definitions SHALL map database records to code-owned metadata
The system SHALL maintain a code-owned permission catalog that maps each `CodeId` to a canonical permission code and family/rank metadata used by authorization logic.

#### Scenario: Authorization resolves canonical permission metadata
- **WHEN** the system evaluates a permission assignment by `CodeId`
- **THEN** it resolves the canonical permission metadata from the code-owned catalog before making an authorization decision

### Requirement: Role permissions SHALL be assignable by permission code identifier
The system SHALL allow roles to be assigned permissions through role-permission records that reference permission definitions by stable identity.

#### Scenario: Role is assigned a permission
- **WHEN** an authorized administrator assigns a permission to a role
- **THEN** the system stores a role-permission record that links the role to the selected permission definition

### Requirement: Permission hierarchy SHALL imply lower permissions within a family
The system SHALL treat higher-ranked permissions in the same permission family as implying all lower-ranked permissions in that family.

#### Scenario: Highest document permission implies lower document permissions
- **WHEN** a user is granted a role that includes `Document.CanDelete`
- **THEN** the system also treats that user as having `Document.CanEdit`, `Document.CanShare`, and `Document.CanView`

#### Scenario: Mid-level document permission does not imply higher permissions
- **WHEN** a user is granted a role that includes `Document.CanShare`
- **THEN** the system treats that user as having `Document.CanView` but not `Document.CanEdit` or `Document.CanDelete`

### Requirement: Administrative authorization SHALL combine roles and permissions
The system SHALL use role assignment, workspace scope, and resolved permission implication to authorize management endpoints.

#### Scenario: Permission-enabled administrator performs allowed action
- **WHEN** a same-workspace administrator has a role that resolves to the required permission
- **THEN** the system authorizes the action

#### Scenario: Missing permission blocks action
- **WHEN** a caller does not resolve to the required permission for an action
- **THEN** the system rejects the action even if the caller is otherwise authenticated
