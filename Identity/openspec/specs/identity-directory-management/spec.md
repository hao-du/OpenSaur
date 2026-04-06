# identity-directory-management Specification

## Purpose
Define the audited workspace, user, role, and permission-management model and APIs used by the Identity service and hosted admin shell.
## Requirements
### Requirement: App-owned identity management tables SHALL use the standard audit shape
The system SHALL store app-owned identity management records with `Id`, `Description`, `IsActive`, `UpdatedBy`, `UpdatedOn`, `CreatedBy`, and `CreatedOn` columns, and runtime-created rows SHALL use version 7 GUID identifiers.

#### Scenario: Custom record is created
- **WHEN** the system creates a workspace, permission, role-permission, user-role assignment, or outbox message record at runtime
- **THEN** the record includes the standard audit columns and a version 7 GUID identifier

### Requirement: Users SHALL be managed through explicit action-style APIs
The system SHALL expose action-style minimal API endpoints for user listing, lookup, creation, editing, administrator password reset, and explicit workspace reassignment, and SHALL store each user in a workspace with JSON user settings metadata. User-management access SHALL be limited to callers who are currently operating inside a specific workspace scope. In non-`Personal` workspaces, workspace-scoped callers with effective `Administrator.CanManage` permission and workspace-scoped `SuperAdministrator` callers MAY manage users. In the `Personal` workspace, only `SuperAdministrator` callers MAY manage users.

#### Scenario: All-workspaces session cannot manage users
- **WHEN** a non-impersonated `SuperAdministrator` session at `All workspaces` calls the user-management endpoints
- **THEN** the system rejects the request instead of exposing cross-workspace user management from the `Users` surface

#### Scenario: Non-superadmin cannot manage Personal workspace users
- **WHEN** a non-superadmin caller in the `Personal` workspace has effective `Administrator.CanManage`
- **THEN** the system still rejects user-management requests for that workspace

#### Scenario: Workspace-scoped admin manages org users
- **WHEN** a workspace-scoped caller in a non-`Personal` workspace has effective `Administrator.CanManage`
- **THEN** the system authorizes list, lookup, create, edit, and deactivate operations for managed users in that workspace

### Requirement: Roles and user-role assignments SHALL be managed explicitly
The system SHALL expose action-style minimal API endpoints for role management and user-role assignment management using app-owned user-role records that support audit data and activation state. The system SHALL also expose backend read support for user-scoped current assignments and active role candidates so the hosted frontend can manage user-role assignment from the `Users` editor without reconstructing the model client-side.

#### Scenario: User-scoped assignments are loaded for a managed user
- **WHEN** an authorized caller requests assignment data for a specific managed user
- **THEN** the system returns the current accessible user-role assignments for that user

#### Scenario: Active role candidates are loaded for user assignment editing
- **WHEN** an authorized caller requests candidate roles for user assignment editing
- **THEN** the system returns only active roles that are valid for the managed scope

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

### Requirement: Directory management SHALL persist workspace-owned role availability
The system SHALL persist workspace-owned role availability through app-owned workspace-role records that support audit data and activation state, and workspace create/edit APIs SHALL manage the selected role ids as part of the workspace save flow.

#### Scenario: Workspace save persists selected role ids
- **WHEN** an authorized super administrator creates or edits a workspace with selected active non-reserved role ids
- **THEN** the system stores workspace-role records for the selected roles and excludes non-selected roles from the active mapping

### Requirement: Workspace-scoped role-assignment reads SHALL honor workspace role availability
The system SHALL filter workspace-scoped role lists and role candidates by the active role availability of the current workspace. Non-reserved roles that are not assigned to the workspace SHALL NOT be returned by the workspace-scoped role-assignment read APIs.

#### Scenario: User role candidates are workspace-scoped
- **WHEN** an authorized caller requests user-assignment role candidates inside a workspace
- **THEN** the system returns only active non-reserved roles assigned to that workspace

#### Scenario: Role assignment list is workspace-scoped
- **WHEN** an impersonated super administrator requests role-assignment roles inside a workspace
- **THEN** the system returns only active non-reserved roles assigned to that workspace
