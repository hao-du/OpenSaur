# identity-fe-workspace-role-availability Specification

## Purpose
TBD - created by archiving change identity-fe-phase-7-workspace-role-availability. Update Purpose after archive.
## Requirements
### Requirement: Workspace editors SHALL manage workspace role availability
The system SHALL let an authorized super administrator manage workspace role availability from the `Workspace` create and edit flows. The available role list SHALL include only active non-reserved roles, and the `SuperAdministrator` role SHALL NOT appear in this workspace-owned assignment surface.

#### Scenario: Create workspace defaults role availability
- **WHEN** a super administrator opens the create workspace flow
- **THEN** the form shows an `Assigned Roles` section
- **AND** the initial selection contains all active non-reserved roles

#### Scenario: Edit workspace updates assigned roles
- **WHEN** a super administrator saves workspace edits with a changed assigned-role selection
- **THEN** the system persists the workspace-role mapping so future workspace-scoped role reads reflect the new selection

#### Scenario: Removed workspace role deactivates matching user-role assignments
- **WHEN** a super administrator removes a role from a workspace and saves the workspace
- **THEN** the system deactivates active user-role assignments for users in that workspace for the removed role

### Requirement: Workspace-scoped admin screens SHALL only show workspace-available roles
The system SHALL restrict workspace-scoped role visibility to roles assigned to the current workspace. `Users` SHALL only offer assigned-role candidates from the current workspace's available roles, and impersonated `Role Assignments` SHALL only list roles assigned to the impersonated workspace.

#### Scenario: Users editor hides roles not assigned to the workspace
- **WHEN** an allowed user-management session loads assigned-role candidates inside a workspace
- **THEN** the editor only offers active non-reserved roles assigned to that workspace

#### Scenario: Role Assignments hides roles not assigned to the impersonated workspace
- **WHEN** an impersonated super administrator opens `Role Assignments`
- **THEN** the page only lists active non-reserved roles assigned to the impersonated workspace

