using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure.Auth;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using System.Security.Claims;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;

namespace OpenSaur.Zentry.Web.Features.Roles.GetRoles;

public static class GetRolesHandler
{
    public static async Task<Ok<IReadOnlyList<GetRolesResponse>>> HandleAsync(
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var rolesQuery = dbContext.Roles
            .AsNoTracking()
            .Where(role => role.NormalizedName != Constants.NormalizedSuperAdministrator);

        if (!ClaimHelper.IsSuperAdministrator(user))
        {
            var workspaceId = ClaimHelper.GetWorkspaceId(user);
            rolesQuery = workspaceId.HasValue
                ? rolesQuery.Where(role => role.WorkspaceRoles.Any(workspaceRole =>
                    workspaceRole.IsActive
                    && workspaceRole.WorkspaceId == workspaceId.Value))
                : rolesQuery.Where(static _ => false);
        }

        var roles = await rolesQuery
            .OrderBy(role => role.Name)
            .ToListAsync(cancellationToken);

        var response = roles
            .Select(role => new GetRolesResponse(
                role.Id,
                role.Name ?? string.Empty,
                role.NormalizedName ?? string.Empty,
                role.Description,
                role.IsActive))
            .ToList();

        return TypedResults.Ok<IReadOnlyList<GetRolesResponse>>(response);
    }
}
