using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.Zentry.Web.Features.Profile;

public static class CurrentProfileHandler
{
    private const string ImpersonationOriginalUserIdClaimType = "impersonation_original_user_id";

    public static async Task<Ok<CurrentProfileResponse>> HandleAsync(
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        SideMenuService sideMenuService,
        CancellationToken cancellationToken)
    {
        var firstName = string.Empty;
        var lastName = string.Empty;
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId != Guid.Empty)
        {
            var currentUser = await dbContext.Users
                .AsNoTracking()
                .Where(candidate => candidate.Id == currentUserId)
                .Select(candidate => new
                {
                    candidate.FirstName,
                    candidate.LastName
                })
                .SingleOrDefaultAsync(cancellationToken);

            if (currentUser is not null)
            {
                firstName = currentUser.FirstName;
                lastName = currentUser.LastName;
            }
        }

        var isSuperAdministrator = ClaimHelper.IsSuperAdministrator(user);
        var canAssignUsers = isSuperAdministrator
            || ClaimHelper.HasPermission(user, Constants.Permissions.Administration.CanManage);
        var canEditRoles = isSuperAdministrator;
        var isImpersonating = user.HasClaim(claim =>
            claim.Type == ImpersonationOriginalUserIdClaimType
            && !string.IsNullOrWhiteSpace(claim.Value));
        var workspaceName = isSuperAdministrator && !isImpersonating
            ? "All workspaces"
            : "Protected workspace";

        var workspaceId = ClaimHelper.GetWorkspaceId(user);
        if (workspaceId.HasValue)
        {
            workspaceName = await dbContext.Workspaces
                .AsNoTracking()
                .Where(workspace => workspace.Id == workspaceId.Value)
                .Select(workspace => workspace.Name)
                .SingleOrDefaultAsync(cancellationToken)
                ?? workspaceName;
        }

        return TypedResults.Ok(new CurrentProfileResponse(
            firstName,
            isImpersonating,
            isSuperAdministrator,
            lastName,
            sideMenuService.BuildNavigationItems(isSuperAdministrator, canAssignUsers),
            workspaceName,
            canAssignUsers,
            canEditRoles));
    }
}
