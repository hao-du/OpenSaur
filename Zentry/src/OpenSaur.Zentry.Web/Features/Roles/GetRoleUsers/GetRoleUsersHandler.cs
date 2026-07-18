using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Roles.GetRoleUsers;

public static class GetRoleUsersHandler
{
    public static async Task<Results<Ok<GetRoleUsersResponse>, NotFound<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        Guid roleId,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var workspaceId = ClaimHelper.GetWorkspaceId(user);
        if (!workspaceId.HasValue)
        {
            return AppHttpResults.BadRequest("Workspace is required.", "User assignment requires a current workspace.");
        }

        var role = await dbContext.Roles
            .AsNoTracking()
            .Where(candidate => candidate.Id == roleId
                && candidate.IsActive
                && candidate.NormalizedName != Constants.NormalizedSuperAdministrator)
            .Where(candidate => candidate.WorkspaceRoles.Any(workspaceRole =>
                workspaceRole.IsActive
                && workspaceRole.WorkspaceId == workspaceId.Value))
            .Select(candidate => new
            {
                candidate.Id,
                candidate.Name
            })
            .SingleOrDefaultAsync(cancellationToken);
        if (role is null)
        {
            return AppHttpResults.NotFound("Role not found.", "No assignable role matched the provided identifier.");
        }

        var assignedUserIds = await dbContext.UserRoles
            .AsNoTracking()
            .Include(userRole => userRole.User)
            .Where(userRole => userRole.RoleId == roleId
                && userRole.IsActive
                && userRole.User != null
                && userRole.User.WorkspaceId == workspaceId.Value
                && userRole.User.IsActive)
            .Select(userRole => userRole.UserId)
            .ToListAsync(cancellationToken);
        var assignedUserIdSet = assignedUserIds.ToHashSet();

        var users = await dbContext.Users
            .AsNoTracking()
            .Where(candidate => candidate.WorkspaceId == workspaceId.Value && candidate.IsActive)
            .OrderBy(candidate => candidate.UserName)
            .Select(candidate => new GetRoleUsersUserResponse(
                candidate.Id,
                candidate.UserName ?? string.Empty,
                candidate.Email ?? string.Empty,
                candidate.FirstName,
                candidate.LastName,
                assignedUserIdSet.Contains(candidate.Id)))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(new GetRoleUsersResponse(
            role.Id,
            role.Name ?? string.Empty,
            users));
    }
}
