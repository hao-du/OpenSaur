using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure.Cache;
using OpenSaur.Zentry.Web.Infrastructure.Database;

namespace OpenSaur.Zentry.Web.Features.Permissions.GetPermissions;

public static class GetPermissionsHandler
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    public static async Task<Ok<IReadOnlyList<GetPermissionsResponse>>> HandleAsync(
        ApplicationDbContext dbContext,
        ICacheService cacheService,
        CancellationToken cancellationToken)
    {
        var cachedPermissions = await cacheService.GetAsync<List<GetPermissionsResponse>>(
            CacheKeys.PermissionsCatalog,
            cancellationToken);

        if (cachedPermissions is not null)
        {
            return TypedResults.Ok<IReadOnlyList<GetPermissionsResponse>>(cachedPermissions);
        }

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

        await cacheService.SetAsync(
            CacheKeys.PermissionsCatalog,
            response,
            CacheDuration,
            cancellationToken);

        return TypedResults.Ok<IReadOnlyList<GetPermissionsResponse>>(response);
    }
}
