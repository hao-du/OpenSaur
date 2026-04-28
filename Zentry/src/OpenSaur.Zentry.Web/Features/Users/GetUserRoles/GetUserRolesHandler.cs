using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Users.GetUserRoles;

public static class GetUserRolesHandler
{
    public static async Task<Results<Ok<GetUserRolesResponse>, NotFound<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var workspaceId = ClaimHelper.GetWorkspaceId(user);
        if (!workspaceId.HasValue)
        {
            return AppHttpResults.BadRequest("Workspace is required.", "User role assignment requires a current workspace.");
        }

        var targetUser = await dbContext.Users
            .AsNoTracking()
            .Where(candidate => candidate.Id == id && candidate.WorkspaceId == workspaceId.Value)
            .Select(candidate => new
            {
                candidate.Id,
                candidate.UserName
            })
            .SingleOrDefaultAsync(cancellationToken);
        if (targetUser is null)
        {
            return AppHttpResults.NotFound("User not found.", "No user in the current workspace matched the provided identifier.");
        }

        var assignedRoleIds = await dbContext.UserRoles
            .AsNoTracking()
            .Where(userRole => userRole.UserId == id && userRole.IsActive)
            .Select(userRole => userRole.RoleId)
            .ToListAsync(cancellationToken);
        var assignedRoleIdSet = assignedRoleIds.ToHashSet();

        var roles = await dbContext.Roles
            .AsNoTracking()
            .Where(role => role.IsActive && role.NormalizedName != Constants.NormalizedSuperAdministrator)
            .Where(role => role.WorkspaceRoles.Any(workspaceRole =>
                workspaceRole.IsActive
                && workspaceRole.WorkspaceId == workspaceId.Value))
            .OrderBy(role => role.Name)
            .Select(role => new GetUserRolesRoleResponse(
                role.Id,
                role.Name ?? string.Empty,
                role.Description,
                assignedRoleIdSet.Contains(role.Id)))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(new GetUserRolesResponse(targetUser.Id, targetUser.UserName ?? string.Empty, roles));
    }
}
