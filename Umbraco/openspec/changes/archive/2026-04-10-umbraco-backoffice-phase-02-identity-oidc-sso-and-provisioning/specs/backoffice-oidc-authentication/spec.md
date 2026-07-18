## ADDED Requirements

### Requirement: Umbraco backoffice SHALL authenticate through the configured Identity issuer
The Umbraco backoffice SHALL use a configured OpenID Connect external login provider so that backoffice sign-in is delegated to the configured Identity issuer instead of a local Umbraco username/password prompt.

#### Scenario: Backoffice login starts at the issuer
- **WHEN** an unauthenticated user navigates to the Umbraco backoffice
- **THEN** Umbraco SHALL challenge through the configured OpenID Connect provider
- **AND** the browser SHALL be redirected to the configured Identity issuer login flow

#### Scenario: Callback path is reserved for OIDC handling
- **WHEN** the issuer redirects back to the Umbraco callback path
- **THEN** Umbraco SHALL treat that callback path as reserved infrastructure routing
- **AND** it SHALL NOT resolve the callback request as website content

### Requirement: Umbraco backoffice SHALL gate access from effective issuer claims
The Umbraco backoffice SHALL allow sign-in only when the effective authenticated session represented by the issuer claims has the `SUPERADMINISTRATOR` role or the `Umbraco.CanManage` permission.

#### Scenario: Superadministrator is allowed
- **WHEN** the effective authenticated session contains the `SUPERADMINISTRATOR` role
- **THEN** Umbraco SHALL allow the backoffice sign-in to continue

#### Scenario: Permission-based user is allowed
- **WHEN** the effective authenticated session contains the `Umbraco.CanManage` permission
- **THEN** Umbraco SHALL allow the backoffice sign-in to continue

#### Scenario: Unauthorized user is rejected
- **WHEN** the effective authenticated session contains neither `SUPERADMINISTRATOR` nor `Umbraco.CanManage`
- **THEN** Umbraco SHALL reject the backoffice sign-in
- **AND** it SHALL NOT create or update a usable local backoffice user for that session

### Requirement: Umbraco backoffice SHALL provision effective users and workspace groups
The Umbraco backoffice SHALL auto-provision the effective user represented by the issuer token and SHALL maintain a workspace-based Umbraco user group named from the effective `workspace_id` claim.

#### Scenario: Missing effective user is auto-created
- **WHEN** a valid authorized issuer login completes and no matching Umbraco backoffice user exists
- **THEN** Umbraco SHALL create a local backoffice user for the effective authenticated identity during login

#### Scenario: Workspace user group is created on demand
- **WHEN** an authorized effective login contains a `workspace_id` claim that does not yet have a matching Umbraco user group
- **THEN** Umbraco SHALL create a user group named from that `workspace_id`

#### Scenario: Effective user is used during impersonation
- **WHEN** the issuer login is for an impersonated effective session
- **THEN** Umbraco SHALL provision and sign in the effective user represented by the issuer token
- **AND** it SHALL use the effective `workspace_id` for workspace-group assignment

### Requirement: Umbraco backoffice SHALL apply root-node access by effective authorization level
The Umbraco backoffice SHALL default non-superadministrator provisioned users to no root-node access and SHALL grant `SUPERADMINISTRATOR` users full root-node access.

#### Scenario: Non-superadministrator receives no root access
- **WHEN** an authorized effective user is not a `SUPERADMINISTRATOR`
- **THEN** the provisioned Umbraco user SHALL have no content root access by default
- **AND** the provisioned Umbraco user SHALL have no media root access by default

#### Scenario: Superadministrator receives full root access
- **WHEN** an authorized effective user has the `SUPERADMINISTRATOR` role
- **THEN** the provisioned Umbraco user SHALL have content root access
- **AND** the provisioned Umbraco user SHALL have media root access
