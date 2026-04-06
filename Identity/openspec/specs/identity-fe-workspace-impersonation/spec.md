# identity-fe-workspace-impersonation Specification

## Purpose
Define how super administrators start and exit workspace impersonation from the hosted shell.
## Requirements
### Requirement: Workspace management SHALL let SuperAdministrator start impersonation from a workspace row
The hosted frontend SHALL let `SuperAdministrator` start impersonation from the `Workspaces` page through a `Login as` flow bound to a selected workspace.

#### Scenario: SuperAdministrator opens login-as options for a workspace
- **WHEN** a `SuperAdministrator` selects the workspace-row `Login as` action
- **THEN** the frontend opens a modal dialog for that workspace
- **AND** the dialog loads impersonation candidates for the selected workspace
- **AND** the dialog provides a searchable user picker for long candidate lists

#### Scenario: Workspace dialog lists active workspace users and super administrators
- **WHEN** the login-as dialog loads successfully
- **THEN** the frontend shows active users that belong to the selected workspace as impersonation choices
- **AND** the frontend also shows active users who hold `SuperAdministrator`
- **AND** the dialog does not show inactive users

### Requirement: Successful impersonation SHALL replace the hosted frontend session
The hosted frontend SHALL replace the current first-party session when impersonation starts and SHALL treat the impersonated identity as the effective authenticated user.

#### Scenario: SuperAdministrator impersonates a workspace user
- **WHEN** `SuperAdministrator` starts impersonation as an active user in the selected workspace
- **THEN** the frontend receives replacement first-party session tokens
- **AND** the current-user context becomes that user's identity, roles, and workspace
- **AND** the frontend navigates into the protected app as that impersonated user

#### Scenario: SuperAdministrator enters a workspace as a super administrator user
- **WHEN** `SuperAdministrator` starts impersonation using an active `SuperAdministrator` user for a selected workspace
- **THEN** the frontend receives replacement first-party session tokens
- **AND** the current-user context becomes that selected `SuperAdministrator` user
- **AND** the effective workspace shown by the hosted shell becomes the selected workspace

### Requirement: The hosted shell SHALL surface active impersonation state
The hosted shell SHALL display active workspace context from the authenticated session and SHALL expose an exit action only while impersonation is active.

#### Scenario: Normal SuperAdministrator session
- **WHEN** a `SuperAdministrator` is not impersonating
- **THEN** the shell shows `All workspaces`
- **AND** the shell does not show an `Exit impersonation` action

#### Scenario: Active impersonation session
- **WHEN** the current first-party session is impersonating
- **THEN** the shell shows the effective workspace name from the authenticated session
- **AND** the shell shows an `Exit impersonation` action

### Requirement: Impersonation SHALL be synchronized across tabs in the same browser session
The hosted frontend SHALL keep impersonation session changes consistent across tabs in the same browser session.

#### Scenario: One tab starts impersonation
- **WHEN** impersonation starts successfully in one browser tab
- **THEN** other authenticated tabs refresh into the impersonated session without requiring manual login

#### Scenario: One tab exits impersonation
- **WHEN** impersonation exits successfully in one browser tab
- **THEN** other authenticated tabs refresh back into the restored super-admin session without requiring manual login

