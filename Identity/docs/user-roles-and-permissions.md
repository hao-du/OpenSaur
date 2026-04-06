# User Roles And Permissions

This document explains how roles, permissions, workspace access, and claim projection work in the Identity service today.

The important rule is:

- endpoints authorize against permissions and access filters, not just UI role names
- roles grant direct permissions
- permissions expand within the same scope by rank
- `SuperAdministrator` is a special bypass and workspace-access case

## Main Code Paths

Domain and seed data:

- `src/OpenSaur.Identity.Web/Domain/Identity/ApplicationRole.cs`
- `src/OpenSaur.Identity.Web/Domain/Identity/ApplicationUserRole.cs`
- `src/OpenSaur.Identity.Web/Domain/Permissions/Permission.cs`
- `src/OpenSaur.Identity.Web/Domain/Permissions/PermissionScope.cs`
- `src/OpenSaur.Identity.Web/Domain/Permissions/RolePermission.cs`
- `src/OpenSaur.Identity.Web/Domain/Permissions/PermissionCode.cs`
- `src/OpenSaur.Identity.Web/Domain/Permissions/PermissionCatalog.cs`
- `src/OpenSaur.Identity.Web/Domain/Permissions/PermissionScopeCatalog.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Database/Seeding/IdentitySeedData.cs`

Authorization and access filters:

- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Builders/PermissionEndpointConventionBuilderExtensions.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Requirements/PermissionAuthorizationRequirement.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Handlers/PermissionAuthorizationHandler.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Builders/WorkspaceEndpointConventionBuilderExtensions.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Builders/UserManagementEndpointConventionBuilderExtensions.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Filters/WorkspaceAccessFilter.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Filters/UserManagementAccessFilter.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Services/PermissionAuthorizationService.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Services/UserAuthorizationService.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Security/CurrentUserContext.cs`

Endpoint and frontend examples:

- `src/OpenSaur.Identity.Web/Features/Roles/RoleEndpoints.cs`
- `src/OpenSaur.Identity.Web/Features/UserRoles/UserRoleEndpoints.cs`
- `src/OpenSaur.Identity.Web/Features/Permissions/PermissionEndpoints.cs`
- `src/OpenSaur.Identity.Web/Features/OidcClients/OidcClientEndpoints.cs`
- `src/OpenSaur.Identity.Web/Features/Auth/Me/GetCurrentUserHandler.cs`
- `src/OpenSaur.Identity.Web/Features/Auth/Oidc/OidcEndpoints.cs`
- `src/OpenSaur.Identity.Web/Features/Auth/AuthSessionPrincipalFactory.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Security/IdentitySessionClaimsTransformation.cs`
- `src/OpenSaur.Identity.Web/client/src/app/router/protectedShellRoutes.ts`

## Current Data Model

The runtime relationship is:

`User -> UserRoles -> Role -> RolePermissions -> Permission -> PermissionScope`

What each piece means:

- `ApplicationUserRole` links a user to a role
- `RolePermission` links a role to a directly assigned permission
- `Permission` stores the canonical code, rank, scope, and active state
- `PermissionScope` groups related permissions that can imply lower-ranked permissions in the same scope

Current permission catalog:

- `Administrator.CanManage`
- `Administrator.CanView`

Current scope and rank model:

- both permissions belong to the `Administrator` scope
- `Administrator.CanManage` has rank `2`
- `Administrator.CanView` has rank `1`

The static catalogs in `PermissionCatalog.cs` and `PermissionScopeCatalog.cs` define the seed metadata, but the runtime authorization source of truth is the active database data loaded by `PermissionAuthorizationService`.

## How Granted Permissions Are Computed

Code locations:

- `PermissionAuthorizationService.cs`
- `CurrentUserContext.cs`
- `IdentitySeedData.cs`

What happens:

1. `PermissionAuthorizationService` loads the caller's active user-role assignments.
2. It joins active roles and filters them again when a workspace context is in play.
3. If any effective role is `SuperAdministrator`, the service returns the special `PermissionSnapshot.SuperAdministrator`.
4. Otherwise it loads the directly assigned active permissions for those effective roles.
5. It loads the other active permissions in the same scopes.
6. It expands the granted set to every permission whose:
   - `PermissionScopeId` matches
   - `Rank` is less than or equal to the assigned permission's rank
7. Later checks use that expanded set, not just the original direct assignment rows.

This means the runtime permission model is database-backed and scope-aware.

## Why `Administrator.CanManage` Also Grants `Administrator.CanView`

Code locations:

- `PermissionCatalog.cs`
- `IdentitySeedData.cs`
- `PermissionAuthorizationService.cs`

What happens:

1. `PermissionCatalog` defines `Administrator.CanManage` and `Administrator.CanView` in the same `Administrator` scope.
2. `IdentitySeedData.GetRolePermissions()` seeds the default `Administrator` role with only one direct permission:
   - `Administrator.CanManage`
3. `PermissionAuthorizationService.ExpandGrantedPermissionCodeIdsAsync(...)` later expands that direct assignment to every active permission in the same scope whose rank is lower or equal.
4. Because `CanView` has rank `1` and `CanManage` has rank `2`, the granted set ends up containing both.

So the `CanView` capability is implied at authorization time. It is not stored as a second `RolePermission` row and it is not hardcoded in the authorization handler.

## How Endpoint Authorization Works

### 1. Endpoints declare the required permission

Code locations:

- `RoleEndpoints.cs`
- `UserRoleEndpoints.cs`
- `PermissionEndpoints.cs`
- `PermissionEndpointConventionBuilderExtensions.cs`

What happens:

1. Protected API groups use `RequireAuthorization(AuthorizationPolicies.Api)`.
2. They add `.RequirePermission(...)` for permission-sensitive operations.
3. `PermissionEndpointConventionBuilderExtensions` attaches a `PermissionAuthorizationRequirement` to the endpoint policy.

Current examples:

- roles endpoints require `Administrator_CanManage`
- user-role endpoints require `Administrator_CanManage`
- permission endpoints require `Administrator_CanManage`

### 2. The authorization handler evaluates the caller

Code locations:

- `PermissionAuthorizationRequirement.cs`
- `PermissionAuthorizationHandler.cs`
- `CurrentUserContext.cs`

What happens:

1. `PermissionAuthorizationHandler` builds `CurrentUserContext` from claims.
2. It asks `PermissionAuthorizationService` whether the caller has every required permission.
3. The requirement succeeds only when all requested permissions are granted in the current effective workspace context.

### 3. Access filters can add extra rules beyond permissions

Code locations:

- `WorkspaceEndpointConventionBuilderExtensions.cs`
- `WorkspaceAccessFilter.cs`
- `UserManagementEndpointConventionBuilderExtensions.cs`
- `UserManagementAccessFilter.cs`
- `UserAuthorizationService.cs`

What happens:

1. `.RequireWorkspaceAccess(...)` adds workspace-sensitive checks.
2. `.RequireUserManagementAccess()` adds the narrower "can manage users here" check.
3. Those filters run alongside normal permission authorization, not instead of it.

Important distinction:

- permission checks answer "does the caller have the capability?"
- workspace filters answer "is the caller allowed to act in this workspace or this user-management context?"

## Workspace And Super-Administrator Rules

Code locations:

- `CurrentUserContext.cs`
- `UserAuthorizationService.cs`
- `WorkspaceAccessFilter.cs`

What happens:

1. `CurrentUserContext.HasGlobalWorkspaceScope` is true only for a super administrator who is not impersonating.
2. `UserAuthorizationService.HasWorkspaceAccessAsync(...)` uses that distinction to decide whether an endpoint needs:
   - any active workspace
   - true global super-administrator scope
   - or a super administrator even while impersonating
3. `RoleEndpoints.cs` uses `RequireWorkspaceAccess(restrictToSuperAdministrator: true, allowImpersonatedSuperAdministrator: true)` for role create and edit.
4. `OidcClientEndpoints.cs` uses `RequireWorkspaceAccess(restrictToSuperAdministrator: true)` without the impersonation allowance.
5. `UserRoleEndpoints.cs` requires normal workspace access and then adds user-management checks on the more sensitive routes.

One surprising but intentional detail:

- `UserAuthorizationService.CanManageUsersAsync(...)` returns `false` for a global, non-impersonating super administrator
- the same super administrator can manage users after choosing an effective workspace through impersonation
- ordinary workspace administrators must also have `Administrator_CanManage`, and the personal workspace is intentionally excluded

## How Claims Are Projected Into Tokens And Hosted Sessions

Code locations:

- `OidcEndpoints.cs`
- `AuthSessionPrincipalFactory.cs`
- `IdentitySessionClaimsTransformation.cs`
- `PermissionAuthorizationService.cs`

What happens:

1. `OidcEndpoints.cs` resolves the effective workspace and active roles for the signing-in user.
2. It asks `PermissionAuthorizationService.GetGrantedPermissionCodesAsync(...)` for the canonical permission-code strings.
3. `AuthSessionPrincipalFactory` adds:
   - repeated `roles` claims
   - repeated `permissions` claims
   - workspace and impersonation state claims
4. `IdentitySessionClaimsTransformation` does the same effective-claim projection for issuer-hosted cookie sessions so hosted mode and bearer-token mode authorize against the same claim model.

Important result:

- downstream apps can use `permissions` claims from the access token instead of reading Identity permission tables directly
- the hosted shell can use the same authorization model even when it is authenticated by cookie instead of bearer token

## How The Frontend Uses The Authorization Model

Code locations:

- `GetCurrentUserHandler.cs`
- `protectedShellRoutes.ts`

What happens:

1. `GET /api/auth/me` returns roles, impersonation state, and `canManageUsers`.
2. `protectedShellRoutes.ts` uses those values to decide whether the current user can see routes such as:
   - `/users`
   - `/role-assignments`
   - `/roles`
   - `/oidc-clients`
3. Route visibility is therefore a UI convenience layered on top of the backend authorization model, not a replacement for backend policy checks.

## If You Want To Change The Implication Rule

The main levers are:

- permission rows and their scope/rank metadata
- the expansion logic in `PermissionAuthorizationService`

Examples:

- adding a new lower-ranked permission in the same scope makes it eligible to be implied by higher-ranked assignments
- moving a permission to a different scope breaks that implication chain
- removing rank-based expansion would change the current "manage implies view" behavior
