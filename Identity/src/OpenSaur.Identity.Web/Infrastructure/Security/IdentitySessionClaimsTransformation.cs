using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Features.Auth;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Services;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles.Dtos;

namespace OpenSaur.Identity.Web.Infrastructure.Security;

public sealed class IdentitySessionClaimsTransformation(
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext dbContext,
    UserRoleRepository userRoleRepository,
    PermissionAuthorizationService permissionAuthorizationService) : IClaimsTransformation
{
    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true
            || CurrentUserContext.Create(principal) is not null)
        {
            return principal;
        }

        var userId = AuthPrincipalReader.GetUserId(principal);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return principal;
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return principal;
        }

        var effectiveWorkspaceId = AuthPrincipalReader.GetImpersonationWorkspaceId(principal) ?? user.WorkspaceId;
        var workspace = await dbContext.Workspaces.FindAsync(effectiveWorkspaceId);
        if (workspace is null || !workspace.IsActive)
        {
            return principal;
        }

        var rolesResult = await userRoleRepository.GetActiveNormalizedRoleNamesForUserAsync(
            new GetActiveNormalizedRoleNamesForUserRequest(user.Id, effectiveWorkspaceId),
            CancellationToken.None);
        var permissionCodes = await permissionAuthorizationService.GetGrantedPermissionCodesAsync(
            user.Id,
            effectiveWorkspaceId,
            CancellationToken.None);
        var applicationPrincipal = AuthSessionPrincipalFactory.Create(
            user,
            rolesResult.Value?.NormalizedRoleNames ?? [],
            permissionCodes,
            ["api"],
            workspaceOverrideId: effectiveWorkspaceId,
            isImpersonating: AuthPrincipalReader.IsImpersonating(principal),
            impersonationOriginalUserId: AuthPrincipalReader.GetImpersonationOriginalUserId(principal));

        return new ClaimsPrincipal(principal.Identities.Concat(applicationPrincipal.Identities));
    }
}
