## MODIFIED Requirements

### Requirement: Permission definitions SHALL map database records by canonical string code
The system SHALL maintain a code-owned permission catalog that maps each canonical permission `Code` to its `PermissionScopeId` and rank metadata used by authorization logic.

#### Scenario: Authorization resolves canonical permission metadata
- **WHEN** the system evaluates a permission assignment by canonical permission `Code`
- **THEN** it resolves the canonical permission metadata from the code-owned catalog before making an authorization decision

#### Scenario: Umbraco capability is present in the built-in catalog
- **WHEN** the system loads the built-in permission catalog
- **THEN** it includes the `Umbraco.CanManage` permission under the `Umbraco` scope

### Requirement: Default permission seed SHALL contain the active built-in permission scopes and definitions
The system SHALL seed all active built-in permission scopes and permissions that remain supported by the application catalog.

#### Scenario: Umbraco scope and permission are seeded
- **WHEN** the system applies the permission-seed migration for this slice
- **THEN** the persisted seed data includes a `PermissionScope` named `Umbraco`
- **AND** the persisted seed data includes a `Permission` with code `Umbraco.CanManage` in that scope
