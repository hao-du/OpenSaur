## MODIFIED Requirements

### Requirement: First-party web SHALL use the configured issuer as the source of trust for browser auth

The system SHALL authenticate first-party browser shells through the configured issuer instead of assuming the current browser host owns credential entry. The system SHALL resolve the active first-party client from managed database records using the effective public origin and app path base for the current host. Managed client records SHALL store origin roots and app path base, while exact redirect and post-logout redirect URIs SHALL be derived by combining those values with configured suffix paths. Only active managed clients SHALL be synchronized into OpenIddict applications.

#### Scenario: Current host resolves its first-party client from managed origins and path base

- **WHEN** the hosted shell or backend token/session path needs the current first-party client
- **THEN** the system first identifies the current managed client from `Oidc.CurrentClient.ClientId` and `Oidc.CurrentClient.ClientSecret` for that deployment
- **AND** the system validates that the effective public origin root and app path base of the current request belong to that managed client
- **AND** the system does not depend on a single hardcoded redirect URI list in appsettings at runtime

#### Scenario: Redirect URIs are derived from managed origins plus per-client paths

- **WHEN** the system registers or serves a managed first-party client
- **THEN** each exact redirect URI is composed from a stored public origin root, a stored app path base, and that managed client's callback path
- **AND** each post-logout redirect URI is composed from the same stored public origin root and app path base plus that managed client's post-logout path

#### Scenario: Inactive managed clients are removed from active issuer registration

- **WHEN** a managed OIDC client is deactivated
- **THEN** the system removes or disables the matching active OpenIddict application registration
- **AND** that client can no longer start new authorization flows until reactivated

### Requirement: Managed OIDC clients SHALL be restricted to super-administrator management

The system SHALL expose application APIs for managed OIDC client administration, and only authenticated super administrators SHALL be allowed to create, read, update, or deactivate those clients.

#### Scenario: Super administrator creates a managed OIDC client

- **WHEN** an authenticated super administrator submits a valid managed OIDC client definition
- **THEN** the system persists the client and its origins
- **AND** the system synchronizes the active registration into OpenIddict

#### Scenario: Non-super-administrator is denied OIDC client administration

- **WHEN** an authenticated caller without the `SuperAdministrator` role invokes a managed OIDC client administration endpoint
- **THEN** the system rejects the request

#### Scenario: Current admin-shell client cannot be deactivated from its own host

- **WHEN** a super administrator attempts to deactivate the currently resolved admin-shell client from that same host
- **THEN** the system rejects the request instead of breaking the active management surface
