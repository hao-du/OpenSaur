# User Roles And Permissions

This document explains how roles, permissions, workspace access, and claim projection work in the Identity service today.

The important rule is:

- endpoints authorize against permissions and access filters, not just UI role names
- permissions are identified by their canonical `Code` string, not a numeric `CodeId`
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
- `Permission` stores the canonical string `Code`, rank, scope, and active state
- `PermissionScope` groups related permissions that can imply lower-ranked permissions in the same scope

Current permission catalog:

- `Administrator.CanManage`
- `Umbraco.CanManage`

Current scope and rank model:

- `Administrator.CanManage` belongs to the `Administrator` scope
- `Umbraco.CanManage` belongs to the `Umbraco` scope
- both built-in permissions currently use rank `1`
- the default seeded role assignment still grants only `Administrator.CanManage`

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

## How Rank-Based Expansion Works

Code locations:

- `PermissionCatalog.cs`
- `IdentitySeedData.cs`
- `PermissionAuthorizationService.cs`

What happens:

1. `PermissionCatalog` defines canonical permission codes and their ranks inside a scope.
2. `IdentitySeedData.GetRolePermissions()` seeds direct role-to-permission assignments.
3. `PermissionAuthorizationService.ExpandGrantedPermissionCodesAsync(...)` expands a direct assignment to every active permission in the same scope whose rank is lower or equal.
4. The current seed data has two built-in permissions in different scopes, so no cross-scope implication occurs by default.

So rank still matters for future permission families, but the default catalog is now simpler.

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

## How To Add A New Permission

The normal add flow has four parts:

1. Define the canonical permission code in code.
2. Register the permission metadata in the catalog.
3. Seed the permission into the database with a stable GUID.
4. Use the permission in endpoint policies or service checks where needed.

### 1. Add the code constant

Code location:

- `src/OpenSaur.Identity.Web/Domain/Permissions/PermissionCode.cs`

What to do:

1. Add a new string constant.
2. The constant value must be the canonical string that appears in the database and JWT `permissions` claims.

Example shape:

```csharp
public const string Umbraco_CanManage = "Umbraco.CanManage";
```

### 2. Register the permission metadata

Code locations:

- `src/OpenSaur.Identity.Web/Domain/Permissions/PermissionCatalog.cs`
- `src/OpenSaur.Identity.Web/Domain/Permissions/PermissionScopeCatalog.cs`

What to do:

1. Add the new permission to `PermissionCatalog.CreateDefinitions()`.
2. Choose:
   - the permission scope
   - display name
   - description
   - rank
3. If the permission belongs to a brand-new scope, add that scope first in `PermissionScopeCatalog.cs`.

Important rule:

- permissions only imply other permissions inside the same scope
- higher rank implies lower rank in that scope

### 3. Seed the database row

Code location:

- `src/OpenSaur.Identity.Web/Infrastructure/Database/Seeding/IdentitySeedData.cs`

What to do:

1. Add a stable GUID to the `PermissionIds` dictionary for the new permission code string.
2. If a default seeded role should receive that permission, add a `RolePermission` seed entry in `GetRolePermissions()`.

Important detail:

- this project uses EF Core `HasData(...)` seeding
- adding a permission is not complete until the seed change is carried by a migration

### 4. Create a migration

Code locations:

- `src/OpenSaur.Identity.Web/Infrastructure/Database/Configurations/PermissionConfiguration.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Database/Seeding/IdentitySeedData.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Database/Migrations/`

What to do:

1. Generate a new EF Core migration after updating the enum, catalog, and seed data.
2. Generate SQL if you use manual migration scripts in deployments.
3. Apply the migration manually to the database.

### 5. Enforce the permission in the app

Code locations:

- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Builders/PermissionEndpointConventionBuilderExtensions.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Services/PermissionAuthorizationService.cs`
- endpoint files such as:
  - `src/OpenSaur.Identity.Web/Features/Users/UserEndpoints.cs`
  - `src/OpenSaur.Identity.Web/Features/Roles/RoleEndpoints.cs`
  - `src/OpenSaur.Identity.Web/Features/Permissions/PermissionEndpoints.cs`

What to do:

1. Add `.RequirePermission(PermissionCode.Your_New_Code)` on protected endpoints.
2. Or call `PermissionAuthorizationService.HasPermissionAsync(...)` directly when the check belongs in business logic or a filter.

### 6. JWT claims happen automatically

Code locations:

- `src/OpenSaur.Identity.Web/Features/Auth/Oidc/OidcEndpoints.cs`
- `src/OpenSaur.Identity.Web/Features/Auth/AuthSessionPrincipalFactory.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Security/IdentitySessionClaimsTransformation.cs`

What happens:

1. Once the permission exists in the active database data and is granted through roles, `PermissionAuthorizationService.GetGrantedPermissionCodesAsync(...)` includes it automatically.
2. Access tokens then emit it as a repeated `permissions` claim when the `api` scope is present.
3. Issuer-hosted cookie sessions project the same effective permission claims.

Important result:

- you do not need a separate JWT-specific code change for each new permission
- the main work is adding the permission definition, seed data, and role assignment

## If You Want To Change The Implication Rule

The main levers are:

- permission rows and their scope/rank metadata
- the expansion logic in `PermissionAuthorizationService`

Examples:

- adding a new lower-ranked permission in the same scope makes it eligible to be implied by higher-ranked assignments
- moving a permission to a different scope breaks that implication chain
- removing rank-based expansion would stop higher-ranked permissions from implying lower-ranked permissions in the same scope
