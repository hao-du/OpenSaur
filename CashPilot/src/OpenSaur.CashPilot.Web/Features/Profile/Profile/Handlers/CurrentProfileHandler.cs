using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Profile.Profile.Services;
using OpenSaur.CashPilot.Web.Infrastructure;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using OpenSaur.CashPilot.Web.Features.Profile;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Profile.Profile.Handlers;

public static class CurrentProfileHandler
{
    public static async Task<Ok<CurrentProfileResponse>> HandleAsync(
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        SideMenuService sideMenuService,
        CancellationToken cancellationToken)
    {
        var email = string.Empty;
        var firstName = string.Empty;
        var lastName = string.Empty;
        var roles = new List<string>();
        var userName = string.Empty;

        var currentUserId = ClaimHelper.GetCurrentUserId(user);
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

        var isImpersonating = ClaimHelper.IsImpersonating(user);
        var isSuperAdministrator = ClaimHelper.IsSuperAdministrator(user);
        var canManage = ClaimHelper.HasPermission(user, Constants.Permissions.CashPilot.CanManage);

        return TypedResults.Ok(new CurrentProfileResponse(
            Id: currentUser.Id.ToString(),
            Email: currentUser.Email,
            FirstName: currentUser.FirstName,
            IsImpersonating: isImpersonating,
            IsSuperAdministrator: isSuperAdministrator,
            LastName: currentUser.LastName,
            NavigationItems: sideMenuService.BuildNavigationItems(canManage),
            Roles: roles,
            UserName: userName,
            WorkspaceName: currentUser.WorkspaceName,
            CanManage: canManage));
    }
}
