using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Domain.Permissions;
using OpenSaur.Zentry.Web.Infrastructure.Database;

namespace OpenSaur.Zentry.Web.Features.Permissions;

public sealed class PermissionService(ApplicationDbContext dbContext)
{
    public async Task<List<Permission>> GetSelectedActivePermissionsAsync(
        IEnumerable<string>? selectedPermissionCodes,
        CancellationToken cancellationToken)
    {
        var permissionCodes = selectedPermissionCodes?
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Distinct(StringComparer.Ordinal)
            .ToArray() ?? [];

        return await dbContext.Permissions
            .Where(permission => permission.IsActive && permissionCodes.Contains(permission.Code))
            .ToListAsync(cancellationToken);
    }
}
