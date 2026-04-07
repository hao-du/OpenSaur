## Why

The Identity permission catalog currently exposes only the built-in administrator permission family. The next client integration slice needs a dedicated Umbraco capability so downstream backoffice access can be granted by a first-class permission code instead of piggybacking on administrator-only permissions.

## What Changes

- Add a new `Umbraco` permission scope to the code-owned scope catalog and seed data.
- Add a new canonical permission constant `Umbraco_CanManage = "Umbraco.CanManage"`.
- Register `Umbraco.CanManage` in the permission catalog and seed it into the `Permissions` table.
- Add an EF migration and SQL scripts that insert the new scope and permission rows.
- Update the permission documentation to reflect the new scope and permission.

## Capabilities

### Modified Capabilities

- `identity-permissions`: The permission catalog and persisted seed data now include a first-class `Umbraco` scope with the `Umbraco.CanManage` permission.

## Impact

- Affected code under `src/OpenSaur.Identity.Web/Domain/Permissions/`
- Permission seed data under `src/OpenSaur.Identity.Web/Infrastructure/Database/Seeding/`
- EF Core migrations and SQL scripts for `PermissionScopes` and `Permissions`
- Permission documentation under `docs/`
