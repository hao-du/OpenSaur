using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Database;

namespace OpenSaur.Identity.Web.Features.Roles.GetRoles;

public static class GetRolesHandler
{
    public static async Task<IResult> HandleAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var payload = await dbContext.Roles
            .AsNoTracking()
            .OrderBy(role => role.Name)
            .Select(role => new GetRolesResponse(
                role.Id,
                role.Name ?? string.Empty,
                role.Description,
                role.IsActive))
            .ToListAsync(cancellationToken);

        return Results.Ok(payload);
    }
}
