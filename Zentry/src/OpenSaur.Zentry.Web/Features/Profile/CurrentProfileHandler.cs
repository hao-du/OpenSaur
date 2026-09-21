using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Cache;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.Zentry.Web.Features.Profile;

public static class CurrentProfileHandler
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public static async Task<Ok<CurrentProfileResponse>> HandleAsync(
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        SideMenuService sideMenuService,
        ICacheService cacheService,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var isImpersonating = ClaimHelper.IsImpersonating(user);
        var workspaceId = ClaimHelper.GetWorkspaceId(user);
        var cacheKey = CacheKeys.UserProfileWithContext(currentUserId, isImpersonating, workspaceId);

        if (currentUserId != Guid.Empty)
        {
            var cached = await cacheService.GetAsync<CurrentProfileResponse>(cacheKey, cancellationToken);
            if (cached is not null)
            {
                return TypedResults.Ok(cached);
            }
        }

        var email = string.Empty;
        var firstName = string.Empty;
        var lastName = string.Empty;
        var roles = new List<string>();
        var userName = string.Empty;

        if (currentUserId != Guid.Empty)
        {
            var currentUser = await dbContext.Users
                .AsNoTracking()
                .Where(candidate => candidate.Id == currentUserId)
                .Select(candidate => new
                {
                    candidate.Email,
                    candidate.FirstName,
                    candidate.LastName,
                    candidate.UserName,
                    Roles = candidate.UserRoles
                        .Where(userRole => userRole.IsActive && userRole.Role != null)
                        .OrderBy(userRole => userRole.Role!.Name)
                        .Select(userRole => userRole.Role!.Name ?? string.Empty)
                        .ToList()
                })
                .SingleOrDefaultAsync(cancellationToken);

            if (currentUser is not null)
            {
                email = currentUser.Email ?? string.Empty;
                firstName = currentUser.FirstName;
                lastName = currentUser.LastName;
                roles = currentUser.Roles;
                userName = currentUser.UserName ?? string.Empty;
            }
        }

        var isSuperAdministrator = ClaimHelper.IsSuperAdministrator(user);
        var canAssignUsers = ClaimHelper.HasPermission(user, Constants.Permissions.Administration.CanManage);
        var canEditRoles = isSuperAdministrator;
        
        var workspaceName = isSuperAdministrator && !isImpersonating
            ? "All workspaces"
            : "Protected workspace";

        if (workspaceId.HasValue)
        {
            workspaceName = await dbContext.Workspaces
                .AsNoTracking()
                .Where(workspace => workspace.Id == workspaceId.Value)
                .Select(workspace => workspace.Name)
                .SingleOrDefaultAsync(cancellationToken)
                ?? workspaceName;
        }

        var response = new CurrentProfileResponse(
            email,
            firstName,
            isImpersonating,
            isSuperAdministrator,
            lastName,
            sideMenuService.BuildNavigationItems(isSuperAdministrator, canAssignUsers),
            roles,
            userName,
            workspaceName,
            canAssignUsers,
            canEditRoles);

        if (currentUserId != Guid.Empty)
        {
            await cacheService.SetAsync(cacheKey, response, CacheDuration, cancellationToken);
        }

        return TypedResults.Ok(response);
    }
}
