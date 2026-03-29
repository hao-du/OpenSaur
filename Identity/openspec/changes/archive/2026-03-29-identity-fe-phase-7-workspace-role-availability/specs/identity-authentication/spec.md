## ADDED Requirements

### Requirement: Effective workspace-scoped role claims SHALL honor workspace role availability
The system SHALL only treat non-reserved roles as effective for a user when the role is both actively assigned to the user and actively assigned to the user's effective workspace. The reserved `SuperAdministrator` role SHALL remain effective without workspace-role assignment.

#### Scenario: Workspace role is removed after user assignment
- **WHEN** a user has an active non-reserved user-role assignment but that role is no longer assigned to the user's effective workspace
- **THEN** the issued effective role claims and permission-derived behavior SHALL exclude that role

#### Scenario: Reserved super administrator remains effective
- **WHEN** a user has the reserved `SuperAdministrator` role
- **THEN** the system treats that role as effective without requiring workspace-role assignment
