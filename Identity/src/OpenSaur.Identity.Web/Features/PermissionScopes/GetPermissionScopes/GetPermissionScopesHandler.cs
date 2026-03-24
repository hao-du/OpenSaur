using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Database;

namespace OpenSaur.Identity.Web.Features.PermissionScopes.GetPermissionScopes;

public static class GetPermissionScopesHandler
{
    public static async Task<IResult> HandleAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var payload = await dbContext.PermissionScopes
            .AsNoTracking()
            .OrderBy(permissionScope => permissionScope.Name)
            .Select(
                permissionScope => new GetPermissionScopesResponse(
                    permissionScope.Id,
                    permissionScope.Name,
                    permissionScope.Description,
                    permissionScope.IsActive))
            .ToListAsync(cancellationToken);

        return Results.Ok(payload);
    }
}
