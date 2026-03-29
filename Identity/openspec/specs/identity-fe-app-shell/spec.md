# identity-fe-app-shell Specification

## Purpose
TBD - created by archiving change identity-fe-phase-2-app-shell. Update Purpose after archive.
## Requirements
### Requirement: Authenticated frontend SHALL provide a responsive application shell
The frontend SHALL provide an authenticated application shell with a top app bar, left navigation region, and main content region for protected application routes.

#### Scenario: Desktop shell renders with a visible sidebar
- **WHEN** an authenticated user opens a protected app route on a desktop viewport
- **THEN** the frontend renders the application shell with a permanently visible left navigation sidebar and a main content area

#### Scenario: Tablet or mobile shell renders with a drawer
- **WHEN** an authenticated user opens a protected app route on a tablet or mobile viewport
- **THEN** the frontend renders the application shell with a menu trigger in the top bar and a collapsible navigation drawer

### Requirement: Frontend navigation SHALL be role-aware
The frontend SHALL render shell navigation items based on the authenticated user's roles.

#### Scenario: SuperAdministrator sees full shell navigation
- **WHEN** the authenticated user has the `SuperAdministrator` role
- **THEN** the navigation includes `Dashboard`, `Workspace`, `Users`, and `Roles`

#### Scenario: Non-SuperAdministrator sees restricted shell navigation
- **WHEN** the authenticated user does not have the `SuperAdministrator` role
- **THEN** the navigation includes `Dashboard` and `Users`
- **AND** the navigation does not include `Workspace` or `Roles`

### Requirement: Frontend SHALL expose clickable placeholder routes for future admin pages
The frontend SHALL expose real protected routes for `Workspace`, `Users`, and `Roles` during the shell phase, and those routes SHALL render intentional placeholder content until later phases implement full behavior.

#### Scenario: User opens a placeholder route that is available to them
- **WHEN** an authenticated user navigates to an allowed placeholder route from the shell
- **THEN** the frontend loads the route successfully
- **AND** the page renders a clear coming-soon state instead of an error or blank screen

### Requirement: Shell components SHALL be responsive across supported device sizes
All shell-level components and layout primitives introduced in this phase SHALL remain usable on mobile, tablet, and desktop viewports.

#### Scenario: Navigation and top bar adapt to smaller screens
- **WHEN** the authenticated shell is rendered on a smaller viewport
- **THEN** the top bar, navigation trigger, navigation drawer, and content region remain usable without horizontal overflow

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

