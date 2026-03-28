## Why

The hosted app now has working workspace management and impersonation, but the `Roles` area is still a placeholder. The next slice needs to separate global role definition from workspace-scoped role assignment so the UI does not mix cross-workspace concerns with impersonated workspace operations.

## What Changes

- Replace the placeholder `Roles` page with a real global role-management surface for super-admin sessions.
- Add a separate `Role Assignments` route that appears only for impersonated super-admin sessions.
- Let super-admin sessions, including impersonated super-admin sessions, manage role metadata and permission mapping without mixing in assigned-user editing.
- Let impersonated super-admin sessions manage assigned users for roles only within the impersonated workspace.
- Update shell navigation so `Workspace` disappears during impersonation and `Role Assignments` appears only during impersonated super-admin sessions.
- Add backend-backed role-assignment read support for role-scoped assignment data and active in-scope candidate users.

## Capabilities

### New Capabilities
- `identity-fe-roles`: Global role list and role-definition editor for super-admin sessions.
- `identity-fe-role-assignments`: Impersonation-only, workspace-scoped role assignment management and conditional shell navigation.

### Modified Capabilities
- `identity-directory-management`: Directory-management APIs add read support for role-scoped user assignments and active in-scope assignment candidates.

## Impact

- Affected frontend code: `src/OpenSaur.Identity.Web/client/src/pages/roles/**`, new `role-assignments` route/pages, shell navigation, and new `features/roles/**` UI/hooks.
- Affected backend code: `src/OpenSaur.Identity.Web/Features/Roles/**`, `src/OpenSaur.Identity.Web/Features/UserRoles/**`, and supporting repository/query helpers.
- Affected tests: frontend page/shell tests, role endpoint tests, and user-role endpoint tests.
- No database schema change is expected; the slice should reuse existing role, permission, and user-role tables.
