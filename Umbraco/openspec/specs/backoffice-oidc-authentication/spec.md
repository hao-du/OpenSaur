## Purpose
Define the expected OpenID Connect sign-in, authorization, user provisioning, workspace-group mapping, and Umbraco admin-access behavior for the OpenSaur-integrated Umbraco backoffice.

## Requirements

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
The Umbraco backoffice SHALL allow sign-in only when the effective authenticated session represented by the issuer claims has the `SUPER ADMINISTRATOR` role or the `Umbraco.CanManage` permission.

#### Scenario: Super administrator is allowed
- **WHEN** the effective authenticated session contains the `SUPER ADMINISTRATOR` role
- **THEN** Umbraco SHALL allow the backoffice sign-in to continue

#### Scenario: Permission-based user is allowed
- **WHEN** the effective authenticated session contains the `Umbraco.CanManage` permission
- **THEN** Umbraco SHALL allow the backoffice sign-in to continue

#### Scenario: Unauthorized user is rejected
- **WHEN** the effective authenticated session contains neither `SUPER ADMINISTRATOR` nor `Umbraco.CanManage`
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

#### Scenario: Workspace group alias is safe for Umbraco persistence
- **WHEN** a workspace group is provisioned from an Identity `workspace_id`
- **THEN** the persisted group alias SHALL use a stable alphanumeric value derived from that workspace ID
- **AND** the visible group name SHALL remain the original `workspace_id`

#### Scenario: Legacy managed workspace group already exists
- **WHEN** a managed workspace group with the same visible workspace name already exists from an earlier provisioning attempt
- **THEN** the provisioning flow SHALL reuse that group instead of creating a duplicate group

#### Scenario: Effective user is used during impersonation
- **WHEN** the issuer login is for an impersonated effective session
- **THEN** Umbraco SHALL provision and sign in the effective user represented by the issuer token
- **AND** it SHALL use the effective `workspace_id` for workspace-group assignment

### Requirement: Umbraco backoffice SHALL complete external OIDC login without replay loops
The Umbraco backoffice SHALL avoid persisting unnecessary external OIDC tokens into the temporary external login cookie used for the backoffice session handoff.

#### Scenario: OIDC callback enriches claims without saving tokens
- **WHEN** OpenSaur Identity returns tokens to the Umbraco OIDC callback
- **THEN** the callback SHALL read the access token during validation to enrich claims
- **AND** the OIDC tokens SHALL NOT be persisted into the external authentication cookie

#### Scenario: OIDC callback prepares standard external-login claims
- **WHEN** OpenSaur Identity returns `sub`, `name`, `preferred_username`, `email`, and `role` claims
- **THEN** the Umbraco external principal SHALL include `ClaimTypes.NameIdentifier` from `sub`
- **AND** it SHALL include `ClaimTypes.Name` from `name` or `preferred_username`
- **AND** it SHALL include `ClaimTypes.Email` from `email`
- **AND** it SHALL include effective role claims needed for authorization decisions

#### Scenario: Backoffice authorize remains owned by Umbraco
- **WHEN** external OIDC login completes
- **THEN** Umbraco SHALL continue its built-in backoffice authorize/token completion flow
- **AND** the external cookie SHALL contain only the principal data required for the Umbraco handoff

#### Scenario: External login synchronization cannot resolve user by identity ID
- **WHEN** the external principal has already passed role or permission authorization
- **AND** the Umbraco identity user cannot be resolved by identity ID alone
- **THEN** synchronization SHALL attempt to resolve the Umbraco user by email or username
- **AND** it SHALL NOT reject the external sign-in solely because immediate user resolution is unavailable

### Requirement: Umbraco backoffice SHALL apply groups and root-node access by effective authorization level
The Umbraco backoffice SHALL default non-superadministrator provisioned users to no root-node access and SHALL grant `SUPER ADMINISTRATOR` users full root-node access and required Umbraco built-in groups.

#### Scenario: Non-superadministrator receives no root access
- **WHEN** an authorized effective user is not a `SUPER ADMINISTRATOR`
- **THEN** the provisioned Umbraco user SHALL have no content root access by default
- **AND** the provisioned Umbraco user SHALL have no media root access by default

#### Scenario: Auto-linked user is allowed to use the backoffice token
- **WHEN** an OpenSaur-authorized user is auto-linked into Umbraco
- **THEN** the Umbraco identity user SHALL be approved
- **AND** the Umbraco identity user email SHALL be confirmed
- **AND** the user SHALL be assigned the workspace group before the backoffice token is consumed

#### Scenario: Current user is assigned to the workspace-derived group
- **WHEN** an OpenSaur-authorized user signs in with a valid `workspace_id`
- **THEN** the current Umbraco backoffice user SHALL be assigned to the group derived from that `workspace_id`
- **AND** synchronization SHALL repair the persisted Umbraco user if that group assignment is missing after update

#### Scenario: Super administrator receives full Umbraco backoffice access
- **WHEN** the OpenSaur-authorized user has the `SUPER ADMINISTRATOR` role
- **THEN** the current Umbraco user SHALL be assigned to the workspace-derived group
- **AND** the current Umbraco user SHALL also be assigned to Umbraco's built-in `Administrators` group
- **AND** the current Umbraco user SHALL also be assigned to Umbraco's built-in `SensitiveData` group
- **AND** the user SHALL receive root content and media access

#### Scenario: Existing linked user is recovered into an allowed state
- **WHEN** an OpenSaur-authorized user signs in with an existing Umbraco account
- **AND** the account is inactive, disabled, or locked out
- **THEN** synchronization SHALL enable or unlock the account before the backoffice token is consumed
