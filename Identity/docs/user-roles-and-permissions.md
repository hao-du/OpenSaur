# User Roles And Permissions

This document explains how user roles, permissions, permission scopes, and authorization checks work in the Identity service today.

It is written against the current implementation in:

- `src/OpenSaur.Identity.Web/Domain/Permissions/*`
- `src/OpenSaur.Identity.Web/Domain/Identity/*`
- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/*`
- `src/OpenSaur.Identity.Web/Features/Roles/*`
- `src/OpenSaur.Identity.Web/Features/UserRoles/*`

## The Short Version

The current model is:

- a `user` gets one or more `roles`
- a `role` gets one or more `permissions`
- a `permission` belongs to a `permission scope`
- endpoint authorization checks required permissions, not role names

One important detail:

- `Administrator.CanManage` also grants `Administrator.CanView`

That behavior does not come from a hidden role override.

It now comes from the permission metadata stored in the `Permissions` table:

- `PermissionScopeId`
- `Rank`
- `Code`

## Main Tables And Relationships

The main entities are:

- `ApplicationRole`
  - file: `src/OpenSaur.Identity.Web/Domain/Identity/ApplicationRole.cs`
  - represents a role such as `Administrator` or `SuperAdministrator`

- `ApplicationUserRole`
  - file: `src/OpenSaur.Identity.Web/Domain/Identity/ApplicationUserRole.cs`
  - links a user to a role
  - stored in table `UserRoles`

- `Permission`
  - file: `src/OpenSaur.Identity.Web/Domain/Permissions/Permission.cs`
  - represents a concrete permission code such as `Administrator.CanManage`

- `PermissionScope`
  - file: `src/OpenSaur.Identity.Web/Domain/Permissions/PermissionScope.cs`
  - groups permissions into a named scope such as `Administrator`

- `RolePermission`
  - file: `src/OpenSaur.Identity.Web/Domain/Permissions/RolePermission.cs`
  - links a role to a permission
  - stored in table `RolePermissions`

So the runtime chain is:

`User -> UserRoles -> Role -> RolePermissions -> Permission`

## Current Permission Metadata

The current permission set is still small and intentionally explicit.

Files:

- `src/OpenSaur.Identity.Web/Domain/Permissions/PermissionCode.cs`
- `src/OpenSaur.Identity.Web/Domain/Permissions/Permission.cs`
- `src/OpenSaur.Identity.Web/Domain/Permissions/PermissionScope.cs`

Today the system defines:

- `Administrator.CanManage`
- `Administrator.CanView`

Both belong to the `Administrator` permission scope.

Each permission row has a `Rank`.

Current ranks:

- `Administrator.CanManage` -> rank `2`
- `Administrator.CanView` -> rank `1`

## Where `CanManage` Also Grants `CanView`

This is the part you asked about most directly.

The behavior is implemented in:

- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Services/PermissionAuthorizationService.cs`

Specifically:

- `GetPermissionSnapshotAsync(Guid userId, ...)`

That method:

1. loads the user's directly assigned active permissions from the database
2. loads active candidate permissions in the same scopes from the database
3. grants candidates whose:
   - `PermissionScopeId` matches
   - `Rank` is less than or equal to the assigned permission's `Rank`

In plain language:

- if a role has `Administrator.CanManage` with rank `2`
- the system also grants `Administrator.CanView` with rank `1`

because both permissions are in the same scope and `1 <= 2`.

This is the exact reason `CanManage` implies `CanView`.

It is not because:

- `ApplicationRole` contains special logic
- `RoleManager` expands permissions
- `PermissionAuthorizationHandler` hardcodes `CanManage`

Instead, the implication is now a database-backed authorization rule based on scope + rank.

One important runtime nuance:

- the authorization service only considers active permission rows
- so `CanManage` only implies `CanView` when `CanView` is still active in `Permissions`

## Concrete Example From Seed Data

The easiest place to see this is the seed data.

File:

- `src/OpenSaur.Identity.Web/Infrastructure/Database/Seeding/IdentitySeedData.cs`

The seeded `Administrator` role gets only one role-permission row:

- `PermissionCode.Administrator_CanManage`

That happens in:

- `GetRolePermissions()`

Notice what is not seeded:

- there is no separate seeded row for `Administrator_CanView`

Even so, a user assigned to the `Administrator` role still effectively has both:

- `Administrator.CanManage`
- `Administrator.CanView`

Why that works:

1. the user gets the `Administrator` role through `UserRoles`
2. the role has one direct `RolePermissions` row for `Administrator_CanManage`
3. the authorization service loads that permission row's `PermissionScopeId` and `Rank`
4. it loads other active permission rows in the same scope
5. it grants those whose rank is lower than or equal to the assigned permission's rank
6. that adds `Administrator_CanView`

So the implied `CanView` is produced at authorization time, not stored as a second assignment row.

## How Endpoint Authorization Works

### 1. Endpoints declare required permissions

Examples:

- `src/OpenSaur.Identity.Web/Features/Roles/RoleEndpoints.cs`
- `src/OpenSaur.Identity.Web/Features/UserRoles/UserRoleEndpoints.cs`
- `src/OpenSaur.Identity.Web/Features/Permissions/PermissionEndpoints.cs`
- `src/OpenSaur.Identity.Web/Features/PermissionScopes/PermissionScopeEndpoints.cs`

These endpoints use:

- `RequireAuthorization(AuthorizationPolicies.Api)`
- `RequirePermission(PermissionCode.Administrator_CanManage)`

The extension method lives in:

- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Builders/PermissionEndpointConventionBuilderExtensions.cs`

It adds a `PermissionAuthorizationRequirement` to the endpoint policy.

### 2. The authorization handler checks the current user

Files:

- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Requirements/PermissionAuthorizationRequirement.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Handlers/PermissionAuthorizationHandler.cs`

The handler:

1. builds `CurrentUserContext` from claims
2. asks `PermissionAuthorizationService` whether the user has the required permissions
3. succeeds only when all required permissions are present

### 3. The authorization service loads role-permission data

The main logic lives in:

- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Services/PermissionAuthorizationService.cs`

The important method is:

- `GetPermissionSnapshotAsync(Guid userId, ...)`

That method:

1. loads active `UserRoles` for the user
2. joins active `Roles`
3. joins active `RolePermissions`
4. joins active `Permissions`
5. builds a permission snapshot for the user

This means the system only considers active assignments and active role/permission records.

### 4. The service applies special rules

There are two important rules.

#### Rule A: `SuperAdministrator` bypass

In `PermissionAuthorizationService.GetPermissionSnapshotAsync(...)`:

- if any assigned role name is `SystemRoles.SuperAdministrator`
- the service returns `PermissionSnapshot.SuperAdministrator`

Then permission checks immediately return `true`.

So `SuperAdministrator` is a role-name-based bypass.

That bypass is separate from normal permission implication.

#### Rule B: permission implication

If the user is not a super administrator, the service does this:

- read directly assigned active permissions from the database
- read active candidate permissions in the same scopes from the database
- compare `PermissionScopeId` and `Rank`
- store the expanded set in `GrantedCodeIds`

That expanded set is what later gets checked by:

- `HasPermissionsAsync(...)`
- `HasPermissionAsync(...)`
- `CanManageWorkspaceAsync(...)`

This is where `CanManage` turning into both `CanManage` and `CanView` happens.

## User Role Assignment Flow

User-role assignment is managed in:

- `src/OpenSaur.Identity.Web/Features/UserRoles/CreateUserRole/CreateUserRoleHandler.cs`
- `src/OpenSaur.Identity.Web/Features/UserRoles/EditUserRole/EditUserRoleHandler.cs`

What these handlers do:

- validate the request
- make sure the target user is accessible
- make sure the requested role exists and is active
- prevent duplicate `(UserId, RoleId)` assignments
- create or update the `ApplicationUserRole` row

Important detail:

- user-role assignment does not copy permissions onto the user

It only links:

- `user -> role`

Permissions are still resolved later through the role at authorization time.

## Role Permission Assignment Flow

Role-permission assignment is managed in:

- `src/OpenSaur.Identity.Web/Features/Roles/CreateRole/CreateRoleHandler.cs`
- `src/OpenSaur.Identity.Web/Features/Roles/EditRole/EditRoleHandler.cs`

These handlers:

- validate selected permission code ids
- load active `Permission` rows for those code ids
- create or update `RolePermission` rows for the role

Important detail:

- the role stores direct permission assignments only
- implied permissions are not materialized as extra `RolePermissions` rows

So if you assign only `Administrator_CanManage` to a role, the database still contains only that direct assignment.

The lower permission is implied later by the database-backed scope + rank rule.

## Workspace-Sensitive Authorization

Some endpoints also apply workspace access filters.

Files:

- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Filters/WorkspaceAccessFilter.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Services/UserAuthorizationService.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Security/CurrentUserContext.cs`

This is separate from permission implication.

Workspace logic answers:

- is the caller allowed to operate in this workspace?

Permission logic answers:

- does the caller have the required capability?

For example, `UserRoleEndpoints` requires both:

- `Administrator_CanManage`
- workspace access

So authorization can fail because of:

- missing permission
- wrong workspace
- inactive workspace

These are different checks.

## `SuperAdministrator` Versus `Administrator`

The two system roles are intentionally different.

### `Administrator`

- normal role with direct permission assignment
- current seed gives it `Administrator_CanManage`
- `Administrator_CanView` is implied by the database-backed scope + rank rule
- typically used as a workspace-scoped administrator

### `SuperAdministrator`

- special cross-workspace role
- detected by role name in `PermissionAuthorizationService`
- bypasses normal permission checks
- also treated specially in `CurrentUserContext` and workspace authorization

So:

- `Administrator` works through permissions
- `SuperAdministrator` works through an explicit bypass rule

## If You Want To Change The Implication Rule

If you want to change whether `CanManage` implies `CanView`, the main place to change is:

- the `Permissions` table data
- the authorization expansion logic in `PermissionAuthorizationService`

More specifically:

- the permission rows' `Rank` values
- the permission rows' `PermissionScopeId`

Examples:

- if you add more permissions in the same scope, rank controls which lower permissions are implied
- if you want no implication at all, the authorization expansion rule would need different logic

## Summary

The current authorization model is:

- endpoints require permissions
- users get roles
- roles get permissions
- permission implication is resolved from database permission metadata
- `SuperAdministrator` is a special bypass role

The specific behavior where `CanManage` also grants `CanView` comes from:

- the assigned permission row's `PermissionScopeId`
- the assigned permission row's `Rank`
- the active candidate permissions in the same scope
- the expansion logic in `PermissionAuthorizationService`

not from hidden role overrides or duplicated permission rows.

One practical nuance:

- the implication rule is implemented today
- but most current administrative endpoints still require `Administrator_CanManage`
- so `Administrator_CanView` is currently more visible in the authorization model than in a large set of separate read-only endpoints
