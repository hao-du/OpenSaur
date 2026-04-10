## MODIFIED Requirements

### Requirement: Umbraco backoffice SHALL provision workspace groups during external login
The Umbraco backoffice SHALL create or reuse a workspace-scoped user group for the effective Identity session during OIDC external login.

#### Scenario: Workspace group alias is safe for Umbraco persistence
- **WHEN** a workspace group is provisioned from an Identity `workspace_id`
- **THEN** the persisted group alias SHALL use a stable alphanumeric value derived from that workspace ID
- **AND** the visible group name SHALL remain the original `workspace_id`

#### Scenario: Workspace group creation succeeds
- **WHEN** Umbraco successfully creates the workspace group
- **THEN** the provisioning flow SHALL use the group returned by `CreateAsync`
- **AND** it SHALL NOT require a second lookup by the pre-normalized alias

#### Scenario: Legacy managed workspace group already exists
- **WHEN** a managed workspace group with the same visible workspace name already exists from an earlier provisioning attempt
- **THEN** the provisioning flow SHALL reuse that group instead of creating a duplicate group
