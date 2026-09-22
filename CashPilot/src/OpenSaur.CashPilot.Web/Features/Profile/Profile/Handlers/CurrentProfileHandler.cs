using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Profile.Profile.Services;
using OpenSaur.CashPilot.Web.Infrastructure;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using OpenSaur.CashPilot.Web.Features.Profile;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Profile.Profile.Handlers;

public static class CurrentProfileHandler
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public static async Task<Ok<CurrentProfileResponse>> HandleAsync(
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        SideMenuService sideMenuService,
        ICacheService cacheService,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var isImpersonating = ClaimHelper.IsImpersonating(user);
        var cacheKey = CacheConstants.ProfileKey(currentUserId);

        if (currentUserId != Guid.Empty)
        {
            var cached = await cacheService.GetAsync<CurrentProfileResponse>(cacheKey, cancellationToken);
            if (cached is not null)
            {
                return TypedResults.Ok(cached);
            }
        }
        var currentUser = await dbContext.Users
            .AsNoTracking()
            .Where(candidate => candidate.Id == currentUserId)
            .SingleOrDefaultAsync(cancellationToken);

        if (currentUser is null)
        {
            return TypedResults.Ok(new CurrentProfileResponse(
                Id: string.Empty,
                Email: string.Empty, 
                FirstName: string.Empty,
                IsImpersonating: false,
                IsSuperAdministrator: false,
                LastName: string.Empty,
                NavigationItems: [],
                Roles: [],
                UserName: string.Empty,
                WorkspaceName: string.Empty,
                CanManage: false));
        }

        var isSuperAdministrator = ClaimHelper.IsSuperAdministrator(user);
        var canManage = ClaimHelper.HasPermission(user, Constants.Permissions.CashPilot.CanManage);

        var response = new CurrentProfileResponse(
            Id: currentUser.Id.ToString(),
            Email: currentUser.Email,
            FirstName: currentUser.FirstName,
            IsImpersonating: isImpersonating,
            IsSuperAdministrator: isSuperAdministrator,
            LastName: currentUser.LastName,
            NavigationItems: sideMenuService.BuildNavigationItems(canManage || isSuperAdministrator),
            Roles: currentUser.Roles ?? [],
            UserName: currentUser.UserName,
            WorkspaceName: currentUser.WorkspaceName,
            CanManage: canManage);

        if (currentUserId != Guid.Empty)
        {
            await cacheService.SetAsync(cacheKey, response, CacheDuration, cancellationToken);
        }

        return TypedResults.Ok(response);
    }
}
