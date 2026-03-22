## ADDED Requirements

### Requirement: App-owned identity management tables SHALL use the standard audit shape
The system SHALL store app-owned identity management records with `Id`, `Description`, `IsActive`, `UpdatedBy`, `UpdatedOn`, `CreatedBy`, and `CreatedOn` columns, and runtime-created rows SHALL use version 7 GUID identifiers.

#### Scenario: Custom record is created
- **WHEN** the system creates a workspace, permission, role-permission, user-role assignment, or outbox message record at runtime
- **THEN** the record includes the standard audit columns and a version 7 GUID identifier

### Requirement: Users SHALL be managed through explicit action-style APIs
The system SHALL expose action-style minimal API endpoints for user listing, lookup, creation, editing, administrator password reset, and explicit workspace reassignment, and SHALL store each user in a workspace with JSON user settings metadata.

#### Scenario: User is created
- **WHEN** an authorized administrator creates a user through the user create endpoint
- **THEN** the system stores the user with a workspace assignment and `UserSettings` JSON payload support

#### Scenario: User is edited
- **WHEN** an authorized administrator edits a user through the user edit endpoint
- **THEN** the system updates the requested user fields without requiring a delete endpoint

#### Scenario: Administrator resets a user password
- **WHEN** an authorized administrator submits a password reset request for a managed user
- **THEN** the system updates the target user's password through the dedicated user-management password action endpoint and requires the target user to change it again on next sign-in

#### Scenario: User workspace is reassigned
- **WHEN** an authorized super administrator submits a change-workspace request for a user and an active target workspace
- **THEN** the system updates the user's workspace membership through the dedicated workspace action endpoint

### Requirement: Roles and user-role assignments SHALL be managed explicitly
The system SHALL expose action-style minimal API endpoints for role management and user-role assignment management using app-owned user-role records that support audit data and activation state.

#### Scenario: Role is created
- **WHEN** an authorized administrator creates a role through the role create endpoint
- **THEN** the system stores the role and makes it available for assignment

#### Scenario: User-role assignment is created
- **WHEN** an authorized administrator creates a user-role assignment through the user-role create endpoint
- **THEN** the system stores an app-owned user-role record that supports audit fields and activation state

### Requirement: Workspace membership SHALL drive administrative scope
The system SHALL place each user in a workspace, create a default `Personal` workspace, and limit `Administrator` actions to the administrator's workspace while allowing `SuperAdministrator` to operate across workspaces.

#### Scenario: Administrator edits same-workspace user
- **WHEN** an administrator edits a user in the same workspace
- **THEN** the system authorizes the operation

#### Scenario: Administrator cannot load different-workspace user
- **WHEN** an administrator requests a user outside their own workspace scope
- **THEN** the system does not expose that user through the scoped user-management query path

#### Scenario: SuperAdministrator edits any-workspace user
- **WHEN** a super administrator edits a user in any workspace
- **THEN** the system authorizes the operation

#### Scenario: Administrator cannot reassign users across workspaces
- **WHEN** an administrator attempts to change a user's workspace membership
- **THEN** the system rejects the operation

### Requirement: Deactivation SHALL use edit endpoints instead of delete endpoints
The system SHALL not expose delete endpoints for app-owned identity management resources and SHALL use `IsActive` updates through edit actions for soft delete behavior.

#### Scenario: User is deactivated
- **WHEN** an authorized administrator edits a user and sets `IsActive` to `false`
- **THEN** the system marks the user inactive and does not perform a hard delete

#### Scenario: Delete route is unavailable
- **WHEN** a client attempts to integrate with identity management APIs
- **THEN** delete endpoints are not part of the supported API surface for users, roles, user-role assignments, or workspaces
