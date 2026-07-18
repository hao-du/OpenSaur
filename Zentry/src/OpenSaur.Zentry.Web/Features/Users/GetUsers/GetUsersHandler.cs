using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Users.GetUsers;

public static class GetUsersHandler
{
    public static async Task<Results<Ok<IReadOnlyList<GetUsersResponse>>, BadRequest<ProblemDetails>>> HandleAsync(
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var workspaceId = ClaimHelper.GetWorkspaceId(user);
        if (!workspaceId.HasValue)
        {
            return AppHttpResults.BadRequest("Workspace is required.", "User management requires a current workspace.");
        }

        var users = await dbContext.Users
            .AsNoTracking()
            .Where(candidate => candidate.WorkspaceId == workspaceId.Value)
            .OrderBy(candidate => candidate.UserName)
            .Select(candidate => new GetUsersResponse(
                candidate.Id,
                candidate.UserName ?? string.Empty,
                candidate.Email ?? string.Empty,
                candidate.FirstName,
                candidate.LastName,
                candidate.Description,
                candidate.IsActive,
                candidate.RequirePasswordChange,
                candidate.UserRoles
                    .Where(userRole => userRole.IsActive
                        && userRole.Role != null
                        && userRole.Role.NormalizedName != Constants.NormalizedSuperAdministrator)
                    .OrderBy(userRole => userRole.Role!.Name)
                    .Select(userRole => userRole.Role!.Name ?? string.Empty)
                    .ToList()))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok<IReadOnlyList<GetUsersResponse>>(users);
    }
}
