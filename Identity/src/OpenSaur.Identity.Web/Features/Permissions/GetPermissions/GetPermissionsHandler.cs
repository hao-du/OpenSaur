using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database;

namespace OpenSaur.Identity.Web.Features.Permissions.GetPermissions;

public static class GetPermissionsHandler
{
    public static async Task<IResult> HandleAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var permissions = await dbContext.Permissions
            .AsNoTracking()
            .Include(permission => permission.PermissionScope)
            .OrderBy(permission => permission.CodeId)
            .ToListAsync(cancellationToken);

        var payload = permissions
            .Select(
                permission =>
                {
                    var definition = PermissionCatalog.GetDefinition(permission.CodeId);
                    return new GetPermissionsResponse(
                        permission.Id,
                        permission.CodeId,
                        permission.PermissionScopeId,
                        permission.PermissionScope?.Name ?? string.Empty,
                        definition.Code,
                        permission.Name,
                        permission.Description,
                        permission.IsActive);
                })
            .ToList();

        return Results.Ok(payload);
    }
}
