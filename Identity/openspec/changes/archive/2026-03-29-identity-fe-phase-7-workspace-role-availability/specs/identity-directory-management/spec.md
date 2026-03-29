## ADDED Requirements

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
