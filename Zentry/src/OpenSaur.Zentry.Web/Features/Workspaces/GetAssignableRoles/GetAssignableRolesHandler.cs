using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Database;

namespace OpenSaur.Zentry.Web.Features.Workspaces.GetAssignableRoles;

public static class GetAssignableRolesHandler
{
    public static async Task<Ok<IReadOnlyList<GetAssignableRolesResponse>>> HandleAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var roles = await dbContext.Roles
            .AsNoTracking()
            .Where(role => role.IsActive)
            .Where(role => role.NormalizedName != Constants.NormalizedSuperAdministrator)
            .OrderBy(role => role.Name)
            .ToListAsync(cancellationToken);

        var response = roles
            .Select(static role => new GetAssignableRolesResponse(
                role.Id,
                role.Name ?? string.Empty,
                role.NormalizedName ?? string.Empty,
                role.Description,
                role.IsActive))
            .ToList();

        return TypedResults.Ok<IReadOnlyList<GetAssignableRolesResponse>>(response);
    }
}
