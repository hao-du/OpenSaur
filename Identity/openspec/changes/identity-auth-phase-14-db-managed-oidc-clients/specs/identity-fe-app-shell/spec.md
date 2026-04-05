## MODIFIED Requirements

### Requirement: Frontend navigation SHALL be role-aware

The frontend SHALL render shell navigation items based on the authenticated user's roles.

#### Scenario: SuperAdministrator sees full shell navigation

- **WHEN** the authenticated user has the `SuperAdministrator` role
- **THEN** the navigation includes `Dashboard`, `Workspace`, `Users`, `OIDC Clients`, and `Roles`

#### Scenario: Non-SuperAdministrator sees restricted shell navigation

- **WHEN** the authenticated user does not have the `SuperAdministrator` role
- **THEN** the navigation includes `Dashboard` and `Users`
- **AND** the navigation does not include `Workspace`, `OIDC Clients`, or `Roles`

### Requirement: Super administrators SHALL manage OIDC clients from the hosted shell

The frontend SHALL expose a protected OIDC client administration route for super administrators, and that page SHALL allow create, edit, and deactivate flows for managed OIDC clients.

#### Scenario: Super administrator opens the OIDC clients page

- **WHEN** a super administrator navigates to the OIDC clients route
- **THEN** the hosted shell loads the managed OIDC client list successfully
- **AND** the page shows the stored origins plus the derived redirect URIs for each client

#### Scenario: Super administrator updates a managed OIDC client

- **WHEN** a super administrator submits changes to a managed OIDC client in the hosted shell
- **THEN** the frontend calls the secured administration API
- **AND** the page refreshes the affected list and details after the operation completes
