using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.Zentry.Web.Features.Profile;

public static class CurrentProfileHandler
{
    public static async Task<Ok<CurrentProfileResponse>> HandleAsync(
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        SideMenuService sideMenuService,
        CancellationToken cancellationToken)
    {
        var email = string.Empty;
        var firstName = string.Empty;
        var lastName = string.Empty;
        var roles = new List<string>();
        var userName = string.Empty;
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
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

        var isImpersonating = ClaimHelper.IsImpersonating(user);
        var isSuperAdministrator = ClaimHelper.IsSuperAdministrator(user);
        var canAssignUsers = ClaimHelper.HasPermission(user, Constants.Permissions.Administration.CanManage);
        var canEditRoles = isSuperAdministrator;
        
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
            canEditRoles));
    }
}
