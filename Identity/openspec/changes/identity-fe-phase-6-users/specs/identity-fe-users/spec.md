## ADDED Requirements

### Requirement: Users SHALL be a workspace-scoped management route
The hosted frontend SHALL expose a `Users` page only when the current authenticated session can manage users in a specific workspace context, and SHALL not expose `Users` for `All workspaces`.

#### Scenario: Real super-admin at All workspaces
- **WHEN** a non-impersonated `SuperAdministrator` session is at `All workspaces`
- **THEN** the shell does not show `Users`
- **AND** the frontend does not expose the `Users` page as an available route

#### Scenario: Allowed workspace-scoped session
- **WHEN** the current session is inside a specific workspace and the backend reports that the session can manage users
- **THEN** the shell shows `Users`
- **AND** the frontend renders the user-management page for `/users`

### Requirement: User management SHALL follow the admin-list filter pattern
The users page SHALL follow the same list-filter behavior established by `Workspace` and `Roles`.

#### Scenario: Users page first loads
- **WHEN** an allowed session opens the `Users` page
- **THEN** the status filter defaults to `Active`
- **AND** the page initially renders only active users unless the caller changes the filter

#### Scenario: User saves while filters are active
- **WHEN** the caller successfully creates or edits a user after changing the active filters
- **THEN** the page refreshes the user list without clearing the applied filters
- **AND** the rendered rows still respect the active filter state after the refresh

### Requirement: User editor SHALL manage core user fields and assigned roles together
The hosted frontend SHALL provide a user editor that lets allowed callers create or edit a user and manage that user's assigned roles in one save flow.

#### Scenario: Caller creates a user
- **WHEN** an allowed caller opens the create-user flow
- **THEN** the editor shows the core user fields
- **AND** the editor shows an `Assigned Roles` section
- **AND** one save action persists the user and the selected role assignments

#### Scenario: Caller edits a user
- **WHEN** an allowed caller opens the edit-user flow
- **THEN** the editor loads the current user details
- **AND** the editor loads the current role assignments for that user
- **AND** the editor allows assigned roles to be added or removed before save

#### Scenario: Reserved SuperAdministrator role is not assignable from Users
- **WHEN** an allowed caller opens the assigned-roles selector in the user editor
- **THEN** the reserved `SuperAdministrator` role is not offered as a selectable role candidate
