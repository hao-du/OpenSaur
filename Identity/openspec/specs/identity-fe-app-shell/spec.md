# identity-fe-app-shell Specification

## Purpose
Define the authenticated React shell, dashboard, navigation, and protected management routes for the hosted Identity frontend.
## Requirements
### Requirement: Authenticated frontend SHALL provide a responsive application shell
The frontend SHALL provide an authenticated application shell with a top app bar, left navigation region, and main content region for protected application routes.

#### Scenario: Desktop shell renders with a visible sidebar
- **WHEN** an authenticated user opens a protected app route on a desktop viewport
- **THEN** the frontend renders the application shell with a permanently visible left navigation sidebar and a main content area

#### Scenario: Tablet or mobile shell renders with a drawer
- **WHEN** an authenticated user opens a protected app route on a tablet or mobile viewport
- **THEN** the frontend renders the application shell with a menu trigger in the top bar and a collapsible navigation drawer

### Requirement: Frontend navigation SHALL be session-aware
The frontend SHALL render shell navigation items based on the authenticated user's roles, effective user-management capability, and impersonation state.

#### Scenario: Global super-administrator session sees global administration navigation
- **WHEN** the authenticated user has the `SuperAdministrator` role and is not in a workspace-scoped management session
- **THEN** the navigation includes `Dashboard`, `Workspace`, `OIDC Clients`, and `Roles`

#### Scenario: Workspace-scoped management session sees workspace administration navigation
- **WHEN** the current authenticated session can manage users in the effective workspace
- **THEN** the navigation includes `Dashboard`, `Users`, and `Role Assignments`

#### Scenario: Session without management capability sees a restricted shell
- **WHEN** the current authenticated session cannot manage users and does not hold super-administrator-only navigation rights for the current scope
- **THEN** the navigation remains limited to the routes available for that session instead of exposing unavailable management pages

### Requirement: Frontend SHALL expose real protected routes for current management pages
The frontend SHALL expose real protected routes for the current dashboard and management pages, and allowed routes SHALL render the current page content instead of placeholder states.

#### Scenario: User opens an allowed protected management route
- **WHEN** an authenticated user navigates to an allowed protected route such as `Dashboard`, `Workspace`, `Users`, `Roles`, or `Role Assignments`
- **THEN** the frontend loads the route successfully
- **AND** the page renders the current management UI instead of a blank or placeholder page

### Requirement: Shell components SHALL be responsive across supported device sizes
All shell-level components and layout primitives SHALL remain usable on mobile, tablet, and desktop viewports.

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

### Requirement: Super administrators SHALL manage OIDC clients from the hosted shell
The frontend SHALL expose a protected OIDC client administration route for super administrators, and that page SHALL allow create, edit, and deactivate flows for managed OIDC clients.

#### Scenario: Super administrator opens the OIDC clients page
- **WHEN** a super administrator navigates to the OIDC clients route
- **THEN** the hosted shell loads the managed OIDC client list successfully
- **AND** the page shows the stored origins, callback path, post-logout path, and the derived redirect URIs for each client

#### Scenario: Super administrator updates a managed OIDC client
- **WHEN** a super administrator submits changes to a managed OIDC client in the hosted shell
- **THEN** the frontend calls the secured administration API
- **AND** the page refreshes the affected list and details after the operation completes

