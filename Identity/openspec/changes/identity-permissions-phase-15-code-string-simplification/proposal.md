## Why

The current permission model keeps both a numeric `CodeId` and a canonical string `Code`, while most integration and JWT-facing behavior already depends on the canonical string. That duplication adds schema, seed, and authorization complexity without providing real value for the current catalog.

## What Changes

- Remove the `Administrator.CanView` permission from code, seed data, and persisted data expectations.
- **BREAKING** Remove the `CodeId` column from the `Permissions` table and stop using integer permission identifiers across the backend.
- Replace `PermissionCode` enum usage with string constants whose values are the canonical permission codes.
- Refactor permission catalog, seed data, authorization services, DTOs, and endpoints to use canonical permission `Code` values plus `Rank` and `PermissionScopeId`.
- Update migration and API contracts so permission lookups, role-permission assignment, and effective-permission expansion no longer rely on integer code identifiers.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `identity-permissions`: Permission definitions, storage, assignment, and authorization checks now use canonical string codes only instead of numeric `CodeId` values, and the default `Administrator.CanView` permission is removed.

## Impact

- Affected code under `src/OpenSaur.Identity.Web/Domain/Permissions/`
- Authorization services, handlers, filters, and endpoint helpers
- Permission and role APIs that currently expose or consume `CodeId`
- EF Core migrations and seed data for `Permissions` and `RolePermissions`
- Any JWT/session permission projection that currently orders or resolves by `CodeId`
