using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure.Database;

namespace OpenSaur.Zentry.Web.Features.Roles.GetRoles;

public static class GetRolesHandler
{
    public static async Task<Ok<IReadOnlyList<GetRolesResponse>>> HandleAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var roles = await dbContext.Roles
            .AsNoTracking()
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
