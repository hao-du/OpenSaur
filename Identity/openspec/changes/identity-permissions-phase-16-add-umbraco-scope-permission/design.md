## Context

The Identity service already uses a code-owned permission catalog plus EF seed data to define built-in permission scopes and permissions. After the string-code simplification, permissions are identified only by their canonical `Code` string and grouped by `PermissionScopeId` plus `Rank`.

This slice adds a dedicated Umbraco capability:

- scope: `Umbraco`
- permission: `Umbraco.CanManage`

## Goals / Non-Goals

**Goals:**
- Add a new built-in permission scope named `Umbraco`.
- Add a new built-in permission code `Umbraco.CanManage`.
- Seed both records into the database through the standard code-owned catalog flow.
- Keep the implementation consistent with the simplified string-code permission model.

**Non-Goals:**
- Add default role assignments for the new permission in this slice.
- Add new endpoint policies that enforce `Umbraco.CanManage`.
- Change existing administrator permission behavior.

## Decisions

### Add a dedicated `Umbraco` permission scope

The Umbraco capability should live in its own scope instead of the existing `Administrator` scope so future Umbraco-specific permissions can be ranked and implied independently.

### Seed `Umbraco.CanManage` without a default role assignment

The permission should exist in the catalog and database immediately, but role assignment should remain an explicit administrator action. This keeps the slice minimal and avoids silently changing access for existing roles.

### Use rank `1` for the first Umbraco permission

`Umbraco.CanManage` is the first permission in its scope, so rank `1` is sufficient. This leaves room for future lower or higher permissions in the same scope without needing another identity change.

## Risks / Trade-offs

- [New seed rows must use stable GUIDs] -> Add explicit IDs in `IdentitySeedData`.
- [Migration must be safe on existing databases] -> Generate a focused insert-only migration and SQL scripts; do not execute them automatically.
- [Future Umbraco permissions may need implication rules] -> Put the permission in its own scope now so rank-based expansion remains clean later.

## Migration Plan

1. Add the new scope and permission constants/catalog definitions.
2. Add stable seed IDs for the new `PermissionScope` and `Permission`.
3. Scaffold an EF migration that inserts the new rows and updates snapshots.
4. Generate full and idempotent SQL scripts for manual application.
5. Run non-test build verification and OpenSpec validation.

## Open Questions

None at the moment.
