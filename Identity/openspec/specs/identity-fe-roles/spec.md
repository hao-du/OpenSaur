# identity-fe-roles Specification

## Purpose
TBD - created by archiving change identity-fe-phase-5-roles-and-assignments. Update Purpose after archive.
## Requirements
### Requirement: Super-admin sessions SHALL access a global roles page
The hosted frontend SHALL provide a `Roles` page for authenticated super-admin sessions, including impersonated super-admin sessions, and SHALL not expose that page to non-superadmin sessions.

#### Scenario: Real super-admin opens the roles page
- **WHEN** a non-impersonated super-admin navigates to `/roles`
- **THEN** the frontend renders the role list
- **AND** the page exposes `Create` and `Edit` actions for global role management

#### Scenario: Non-superadmin cannot access the roles page
- **WHEN** a non-superadmin session attempts to navigate to `/roles`
- **THEN** the frontend does not expose the roles page as an available application route

### Requirement: Global role editing SHALL manage role definition and permissions only
The roles editor SHALL let super-admin sessions manage role metadata and permission assignments without exposing assigned-user editing in that editor.

#### Scenario: Super-admin creates a role
- **WHEN** a super-admin opens the create-role flow
- **THEN** the editor shows `Role` and `Permissions` sections
- **AND** one save action persists the role metadata and selected permissions together

#### Scenario: Super-admin edits a role
- **WHEN** a super-admin opens the edit-role flow
- **THEN** the editor loads the current role metadata and permission assignments
- **AND** the editor does not show an `Assigned Users` section

#### Scenario: Impersonated super-admin opens the roles page
- **WHEN** an impersonated super-admin navigates to `/roles`
- **THEN** the frontend renders the role list
- **AND** the frontend exposes create and edit actions for role definitions

