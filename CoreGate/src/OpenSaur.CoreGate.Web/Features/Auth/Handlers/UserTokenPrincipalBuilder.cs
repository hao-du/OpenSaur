using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Features.Auth.Services;
using OpenSaur.CoreGate.Web.Infrastructure.Database;
using OpenSaur.CoreGate.Web.Infrastructure.Security;
using System.Security.Claims;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers;

public static class UserTokenPrincipalBuilder
{
    public static async Task<ClaimsPrincipal?> BuildUserClaimPrincipalAsync(
        ClaimsPrincipal sourcePrincipal,
        IEnumerable<string> requestedScopes,
        ApplicationDbContext dbContext,
        UserRolePermissionService authorizationDataService,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken
    )
    {
        var userId = ClaimPrincipalHelpers.GetUserId(sourcePrincipal);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return null;
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return null;
        }

        var workspace = await dbContext.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(candidate => candidate.Id == user.WorkspaceId && candidate.IsActive, cancellationToken);
        if (workspace is null)
        {
            return null;
        }

        var roles = await authorizationDataService.GetActiveNormalizedRoleNamesForUserAsync(user.Id, workspace.Id, cancellationToken);
        var permissions = await authorizationDataService.GetGrantedPermissionCodesAsync(user.Id, workspace.Id, cancellationToken);

        return ClaimPrincipalHelpers.Create(user, roles, permissions, requestedScopes);
    }
}
