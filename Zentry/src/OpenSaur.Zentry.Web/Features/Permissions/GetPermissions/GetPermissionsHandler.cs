using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure.Database;

namespace OpenSaur.Zentry.Web.Features.Permissions.GetPermissions;

public static class GetPermissionsHandler
{
    public static async Task<Ok<IReadOnlyList<GetPermissionsResponse>>> HandleAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var permissions = await dbContext.Permissions
            .AsNoTracking()
            .Include(permission => permission.PermissionScope)
            .OrderBy(permission => permission.PermissionScope!.Name)
            .ThenBy(permission => permission.Rank)
            .ThenBy(permission => permission.Name)
            .ToListAsync(cancellationToken);

        var response = permissions
            .Select(permission => new GetPermissionsResponse(
                permission.Id,
                permission.PermissionScopeId,
                permission.PermissionScope?.Name ?? string.Empty,
                permission.Code,
                permission.Name,
                permission.Description,
                permission.IsActive))
            .ToList();

        return TypedResults.Ok<IReadOnlyList<GetPermissionsResponse>>(response);
    }
}
