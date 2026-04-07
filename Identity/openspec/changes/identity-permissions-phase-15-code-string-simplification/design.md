## Context

The Identity service currently models permissions with both a numeric `CodeId` and a canonical string `Code`. The runtime authorization path also carries that duplication: `PermissionCode` is an enum, `PermissionCatalog` maps enum values to strings, EF seed data keys permissions by integer id, and authorization services expand granted permissions by integer code id.

The requested simplification is to make the canonical string code the only permission identity in both code and database, remove `Administrator.CanView`, and keep ordering/implication logic based on `Rank` and `PermissionScopeId`.

## Goals / Non-Goals

**Goals:**
- Remove `Administrator.CanView` from code and data model expectations.
- Remove `Permissions.CodeId` and all integer permission-identifier usage.
- Replace `PermissionCode` enum usage with string constants.
- Keep permission implication/rank behavior working through `Code`, `Rank`, and `PermissionScopeId`.
- Keep permission claims in tokens and hosted sessions aligned to canonical string codes.

**Non-Goals:**
- Redesign permission scopes.
- Redesign role-permission persistence shape beyond removing `CodeId` dependencies.
- Introduce new permissions or new authorization policies in this slice.

## Decisions

### Use canonical `Code` string as the only permission identity

The domain already treats the canonical string code as the meaningful integration identifier: JWT `permissions` claims, UI display logic, and downstream clients all care about the string code. Keeping `CodeId` duplicates identity and forces extra mapping.

Alternative considered:
- Keep `CodeId` internally and expose only `Code` externally.
  - Rejected because it preserves the same seed, migration, and mapping complexity the user wants removed.

### Replace `PermissionCode` enum with string constants

An enum only adds value when integer identity matters. After removing `CodeId`, using string constants makes the code simpler and matches the DB and token representation directly.

Alternative considered:
- Keep the enum names and add helper methods to map to string values.
  - Rejected because it preserves an unnecessary translation layer.

### Keep implication based on scope and rank

Permission implication should continue to be determined by `PermissionScopeId` and `Rank`. The only change is that granted sets and required permission checks use canonical string `Code` values rather than integer ids.

Alternative considered:
- Remove rank implication entirely because only one built-in permission remains.
  - Rejected because it would be a broader behavior change than requested and would make future permissions harder to add cleanly.

### Migrate API contracts away from `CodeId`

Permission read models and role-assignment inputs/outputs that currently expose `CodeId` or `PermissionCodeIds` should move to `Code` or `PermissionCodes`.

Alternative considered:
- Keep old DTO fields temporarily for compatibility.
  - Rejected because this workspace does not appear to need backward-compatibility shims for external consumers, and it would weaken the simplification.

## Risks / Trade-offs

- [Breaking API shape for permission and role endpoints] → Update the FE and any in-repo consumers in the same slice.
- [Migration must remove seeded data cleanly] → Generate a focused EF migration and SQL scripts; do not execute them automatically.
- [Old `Administrator.CanView` rows may exist in deployed databases] → Make the migration delete the obsolete permission row and related role-permission rows before dropping `CodeId`.
- [Refactor touches many authorization paths] → Keep the model centered on `Code` strings and verify with a full release build plus OpenSpec validation.

## Migration Plan

1. Change the domain model, catalogs, and seed data to string-based permission codes only.
2. Refactor authorization services, endpoint helpers, DTOs, and FE usage from `CodeId` to `Code`.
3. Add an EF migration that:
   - deletes obsolete `Administrator.CanView` seeded data and dependent role-permission rows
   - drops `Permissions.CodeId`
   - updates seed data snapshots
4. Generate SQL scripts for manual database application.
5. Run non-test build verification and OpenSpec validation.

## Open Questions

None at the moment.
