## MODIFIED Requirements

### Requirement: Roles and user-role assignments SHALL be managed explicitly
The system SHALL expose action-style minimal API endpoints for role management and user-role assignment management using app-owned user-role records that support audit data and activation state. The system SHALL also expose backend read support for role-scoped assignment inspection and active in-scope user candidates so the hosted frontend can manage workspace-scoped role assignments without reconstructing the model client-side.

#### Scenario: Role is created
- **WHEN** an authorized administrator creates a role through the role create endpoint
- **THEN** the system stores the role and makes it available for assignment

#### Scenario: User-role assignment is created
- **WHEN** an authorized administrator creates a user-role assignment through the user-role create endpoint
- **THEN** the system stores an app-owned user-role record that supports audit fields and activation state

#### Scenario: Role-scoped assignments are loaded for managed scope
- **WHEN** an authorized caller requests assignment data for a specific role within their managed scope
- **THEN** the system returns the current accessible user-role assignments for that role

#### Scenario: Active assignment candidates are loaded for managed scope
- **WHEN** an authorized caller requests candidate users for role assignment within their managed scope
- **THEN** the system returns only active users visible in that scope
