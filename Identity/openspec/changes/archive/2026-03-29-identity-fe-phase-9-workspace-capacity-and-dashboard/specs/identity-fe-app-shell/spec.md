## ADDED Requirements

### Requirement: Dashboard route SHALL render role-aware summary blocks
The frontend SHALL render summary blocks on the dashboard, and the displayed data SHALL vary by the current session scope.

#### Scenario: Real super-admin opens dashboard at All workspaces
- **WHEN** a non-impersonated `SuperAdministrator` opens the dashboard
- **THEN** the dashboard shows global summary blocks for workspaces, users, and roles
- **AND** the dashboard shows quick actions relevant to global administration

#### Scenario: Workspace-scoped session opens dashboard
- **WHEN** a workspace-scoped or impersonated session opens the dashboard
- **THEN** the dashboard shows workspace-specific summary blocks
- **AND** the dashboard includes active and inactive user counts
- **AND** the dashboard includes capacity usage when the workspace has a maximum active-user limit

### Requirement: Shell SHALL expose an icon-only impersonation exit action
The authenticated shell SHALL render the impersonation exit action as an icon-only control when the current session is impersonating.

#### Scenario: Impersonated session renders shell header
- **WHEN** the current session is impersonating a workspace
- **THEN** the shell renders an icon-only impersonation exit control
- **AND** the control exposes a tooltip and accessible label for `Exit impersonation`

## REMOVED Requirements

### Requirement: Dashboard route SHALL remain intentionally empty in this phase
**Reason**: The dashboard now needs to communicate session-scoped workspace and admin state instead of remaining a placeholder.
**Migration**: Replace callers and tests that expect an empty dashboard with assertions against the new summary blocks.
