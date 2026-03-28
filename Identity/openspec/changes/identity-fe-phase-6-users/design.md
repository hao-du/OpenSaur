## Context

The backend already supports user CRUD, administrator password reset, workspace reassignment, role CRUD, and user-role assignment mutations. The hosted frontend already understands authentication, workspace scope, and impersonation state through `/api/auth/me`, but it still renders `Users` as a placeholder route.

The approved behavior makes `Users` stricter than the earlier placeholder shell:

- `Users` is unavailable at `All workspaces`
- `Users` is available only in a specific workspace context
- in non-`Personal` workspaces, `SuperAdministrator` and callers with `Administrator.CanManage` can manage users
- in `Personal`, only `SuperAdministrator` can manage users

That rule cannot be derived from role names alone on the frontend, because the hosted shell does not know whether the current session has `Administrator.CanManage`. The backend therefore needs to expose a session capability flag and enforce the same rule on the API surface.

## Goals / Non-Goals

**Goals:**
- Replace the placeholder `Users` page with a real list and editor.
- Keep `Users` workspace-scoped and hide it from `All workspaces`.
- Enforce the `Personal` workspace special case consistently in backend authorization and frontend navigation.
- Reuse the existing admin-list filter pattern: `Active` default, reset to `Active`, preserve filters after successful save.
- Let the user editor load and save assigned roles in one UI flow.

**Non-Goals:**
- Adding bulk user operations
- Adding user self-service profile editing
- Reworking password-reset UX for administrator-managed users
- Changing role-definition or role-assignment behavior outside what is needed for user editing
- Adding cross-workspace user management from the `Users` page

## Decisions

### 1. `/api/auth/me` will expose `canManageUsers`

The hosted shell needs a stable, session-derived capability to decide whether to show the `Users` route. Role names are insufficient because non-superadmin access depends on permissions and the `Personal` workspace exception.

The backend will compute `canManageUsers` from:

- current workspace scope
- `SuperAdministrator` status
- effective `Administrator.CanManage` permission
- whether the current workspace is `Personal`

This keeps the route visibility and direct-route guards aligned with backend truth.

### 2. User-management access will be enforced by a dedicated backend access rule

The existing `RequireWorkspaceAccess()` behavior is too broad for `Users`, because it allows `SuperAdministrator` sessions at `All workspaces` and does not special-case `Personal`.

The change will add a focused user-management access rule used by `/api/user/*` and the user-scoped assignment endpoints needed by the user editor. That rule will:

- reject global `All workspaces` scope
- reject non-superadmin callers in `Personal`
- allow workspace-scoped `SuperAdministrator`
- allow workspace-scoped callers with `Administrator.CanManage` outside `Personal`

This keeps the policy explicit instead of hiding it in repository queries.

### 3. The Users page will follow the same list-management pattern as Workspace and Roles

The page will use:

- a filter drawer with `Search` and `Status`
- default status `Active`
- reset back to `Active`
- preserved filters after successful create/edit save

That keeps the admin screens consistent and follows the existing pattern already established by `Workspace` and `Roles`.

### 4. The user editor will save user details and assigned roles in one flow

The editor will include:

- `User` section for core user fields
- `Assigned Roles` section for active role assignment management

The UI save action will orchestrate:

- user create or edit
- role assignment add / deactivate / reactivate as needed

This keeps the editor coherent from the operator's perspective even though the backend uses separate user and user-role endpoints.

### 5. User-scoped role-assignment reads will be added instead of overfetching generic lists

The current backend has role-scoped assignment reads for the impersonation-driven role-assignment page, but the user editor needs the inverse view:

- current assignments for one managed user
- active role candidates for that same managed scope

The change will add focused read endpoints for that model rather than forcing the frontend to fetch all assignments and rebuild the user editor client-side.

## Risks / Trade-offs

- [Capability duplication between `/api/auth/me` and backend filters] -> Keep `canManageUsers` derived from the same access rule logic instead of maintaining two divergent implementations.
- [One save button spans user and role-assignment APIs] -> Keep the orchestration explicit in a dedicated frontend hook and cover add, remove, and reactivate cases with tests.
- [Existing repository scope still supports global reads] -> Move the `Users` access decision to authorization/filter code so repository methods stay reusable without silently broadening access.
- [Reserved roles remain assignable through existing assignment APIs] -> This change will preserve the current assignment model and will not redefine reserved-role semantics unless a later approved change requires it.
