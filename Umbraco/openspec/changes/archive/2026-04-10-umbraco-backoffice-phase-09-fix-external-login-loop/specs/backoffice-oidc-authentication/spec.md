## MODIFIED Requirements

### Requirement: Umbraco backoffice SHALL complete external OIDC login without replay loops
The Umbraco backoffice SHALL avoid persisting unnecessary external OIDC tokens into the temporary external login cookie used for the backoffice session handoff.

#### Scenario: OIDC callback enriches claims without saving tokens
- **WHEN** OpenSaur Identity returns tokens to the Umbraco OIDC callback
- **THEN** the callback SHALL read the access token during validation to enrich claims
- **AND** the OIDC tokens SHALL NOT be persisted into the external authentication cookie

#### Scenario: OIDC callback prepares standard external-login claims
- **WHEN** OpenSaur Identity returns `sub`, `name`, `preferred_username`, and `email` claims
- **THEN** the Umbraco external principal SHALL include `ClaimTypes.NameIdentifier` from `sub`
- **AND** it SHALL include `ClaimTypes.Name` from `name` or `preferred_username`
- **AND** it SHALL include `ClaimTypes.Email` from `email`

#### Scenario: Backoffice authorize remains owned by Umbraco
- **WHEN** external OIDC login completes
- **THEN** Umbraco SHALL continue its built-in backoffice authorize/token completion flow
- **AND** the external cookie SHALL contain only the principal data required for the Umbraco handoff

#### Scenario: External login synchronization cannot resolve user by identity ID
- **WHEN** the external principal has already passed role or permission authorization
- **AND** the Umbraco identity user cannot be resolved by identity ID alone
- **THEN** synchronization SHALL attempt to resolve the Umbraco user by email or username
- **AND** it SHALL NOT reject the external sign-in solely because immediate user resolution is unavailable

#### Scenario: Auto-linked user is allowed to use the backoffice token
- **WHEN** an OpenSaur-authorized user is auto-linked into Umbraco
- **THEN** the Umbraco identity user SHALL be approved
- **AND** the Umbraco identity user email SHALL be confirmed
- **AND** the user SHALL be assigned the workspace group before the backoffice token is consumed

#### Scenario: Current user is assigned to the workspace-derived group
- **WHEN** an OpenSaur-authorized user signs in with a valid `workspace_id`
- **THEN** the current Umbraco backoffice user SHALL be assigned to the group derived from that `workspace_id`
- **AND** synchronization SHALL fail if the persisted Umbraco user is not assigned to that group after update

#### Scenario: Super administrator receives full Umbraco backoffice access
- **WHEN** the OpenSaur-authorized user has the `SUPERADMINISTRATOR` role
- **THEN** the current Umbraco user SHALL be assigned to the workspace-derived group
- **AND** the current Umbraco user SHALL also be assigned to Umbraco's built-in administrator group
- **AND** the user SHALL receive root content and media access

#### Scenario: Existing linked user is recovered into an allowed state
- **WHEN** an OpenSaur-authorized user signs in with an existing Umbraco account
- **AND** the account is inactive, disabled, or locked out
- **THEN** synchronization SHALL enable or unlock the account before the backoffice token is consumed
