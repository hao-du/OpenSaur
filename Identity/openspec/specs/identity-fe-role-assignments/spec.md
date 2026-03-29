# identity-fe-role-assignments Specification

## Purpose
TBD - created by archiving change identity-fe-phase-5-roles-and-assignments. Update Purpose after archive.
## Requirements
### Requirement: Role Assignments SHALL be a separate impersonation-only route
The hosted frontend SHALL expose `Role Assignments` as a separate left-navigation item only when the current session is an impersonated super-admin session.

#### Scenario: Normal super-admin session
- **WHEN** a super-admin session is not impersonating a workspace
- **THEN** the shell shows `Workspace`
- **AND** the shell does not show `Role Assignments`

#### Scenario: Impersonated super-admin session
- **WHEN** a super-admin session is impersonating a workspace
- **THEN** the shell hides `Workspace`
- **AND** the shell shows `Role Assignments`

### Requirement: Role Assignments SHALL manage assigned users in the impersonated workspace only
The hosted frontend SHALL provide a workspace-scoped role-assignment surface that edits assigned users for roles only within the impersonated workspace.

#### Scenario: Impersonated super-admin opens role assignments
- **WHEN** an impersonated super-admin navigates to `/role-assignments`
- **THEN** the frontend renders a role list for the current workspace context
- **AND** editing a role opens an `Assigned Users` editor only

#### Scenario: Save persists assignment changes for one role
- **WHEN** the impersonated super-admin adds or removes users from a role and clicks save
- **THEN** the frontend persists the role-assignment changes for that role in one save flow
- **AND** the role-definition fields and permission-mapping fields are not part of that save flow

### Requirement: Assigned-user selection SHALL be limited to active users in scope
The assigned-user picker SHALL list only active users from the impersonated workspace, and each option SHALL display the user's workspace as supporting text.

#### Scenario: Candidate users are loaded for assigned-user editing
- **WHEN** the assigned-user editor loads candidate users for a role
- **THEN** the picker lists only active users from the impersonated workspace
- **AND** each option shows the username with a smaller workspace label

#### Scenario: Existing assigned users are displayed
- **WHEN** the assigned-user editor loads current assignments for a role
- **THEN** the frontend shows the currently assigned users for that role within the impersonated workspace
- **AND** the UI provides a remove action for each displayed assignment

