# identity-fe-users Specification

## Purpose
Define the workspace-scoped users management experience for listing, creating, editing, and assigning roles to users.
## Requirements
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

### Requirement: User management SHALL enforce the workspace maximum active-user limit
User management SHALL prevent operations that would increase the active-user count above the current workspace limit.

#### Scenario: Caller creates a user when capacity is available
- **WHEN** the current workspace has remaining active-user capacity or no configured limit
- **THEN** the caller can create a new active user

#### Scenario: Caller creates a user when capacity is exhausted
- **WHEN** the current workspace has a configured active-user limit and the active-user count is already at that limit
- **THEN** the caller cannot create a new active user
- **AND** the system returns a validation error explaining that the workspace user limit has been reached

#### Scenario: Caller reactivates an inactive user when capacity is exhausted
- **WHEN** the current workspace has a configured active-user limit and the active-user count is already at that limit
- **AND** the caller edits an inactive user and changes them to active
- **THEN** the save is rejected with a validation error explaining that the workspace user limit has been reached

#### Scenario: Caller edits an already-active user while workspace is over limit
- **WHEN** the current workspace is already above its configured active-user limit because of a prior workspace-limit change
- **AND** the caller edits an already-active user without deactivating or reactivating them
- **THEN** the save remains allowed

### Requirement: User list SHALL preview assigned roles inline
The user management list SHALL surface each user's assigned roles using the same compact preview pattern as the workspace list.

#### Scenario: User has up to two assigned roles
- **WHEN** a user row has one or two assigned roles
- **THEN** the list shows those roles inline in the `Roles` column

#### Scenario: User has more than two assigned roles
- **WHEN** a user row has more than two assigned roles
- **THEN** the list shows only the first two roles inline
- **AND** the list shows a `+N` overflow indicator
- **AND** selecting the overflow indicator reveals the remaining roles in a popover

