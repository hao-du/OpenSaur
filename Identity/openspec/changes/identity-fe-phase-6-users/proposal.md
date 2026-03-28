## Why

The hosted app now has working shell, workspace, impersonation, and role-management flows, but `Users` is still a placeholder. The next slice needs to replace that placeholder with real workspace-scoped user management while enforcing the special `Personal` workspace rule and keeping `All workspaces` out of the user-management surface.

## What Changes

- Replace the placeholder `Users` page with a real user-management surface.
- Make `Users` available only when the authenticated session is inside a specific workspace context.
- Allow user management in non-`Personal` workspaces for:
  - `SuperAdministrator`
  - callers whose effective permissions include `Administrator.CanManage`
- Restrict `Personal` workspace user management to `SuperAdministrator` only, even if another caller has `Administrator.CanManage`.
- Extend `/api/auth/me` so the hosted shell can determine whether the current session can access `Users`.
- Add user-scoped role-assignment read support so the user editor can load current role assignments and active role candidates.
- Let the hosted frontend add, edit, deactivate, and role-assign users from one save flow while preserving the existing admin-list filter pattern.

## Capabilities

### New Capabilities
- `identity-fe-users`: Workspace-scoped user list and editor for allowed sessions.

### Modified Capabilities
- `identity-authentication`: `/api/auth/me` includes the current session's `Users` access capability for shell routing.
- `identity-directory-management`: User-management and user-role APIs enforce the new workspace-scoped access rules and expose user-scoped role-assignment reads.

## Impact

- Affected frontend code: `src/OpenSaur.Identity.Web/client/src/pages/users/**`, shell route visibility, and new user-management hooks/components.
- Affected backend code: `src/OpenSaur.Identity.Web/Features/Users/**`, `src/OpenSaur.Identity.Web/Features/UserRoles/**`, `src/OpenSaur.Identity.Web/Features/Auth/Me/**`, and supporting authorization/repository helpers.
- Affected tests: frontend router/page tests, backend user endpoint tests, backend user-role endpoint tests, and auth `/me` tests.
- No database schema change is expected; the slice should reuse the existing user, role, and user-role tables.
