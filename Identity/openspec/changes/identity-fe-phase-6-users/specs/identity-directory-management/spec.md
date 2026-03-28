## MODIFIED Requirements

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
