using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Database;

namespace OpenSaur.Zentry.Web.Features.Roles;

public sealed class RoleService(ApplicationDbContext dbContext)
{
    public async Task<List<Guid>> GetSelectedActiveRoleIdsAsync(
        IEnumerable<Guid>? selectedRoleIds,
        CancellationToken cancellationToken)
    {
        var roleIds = selectedRoleIds?.Distinct().ToArray() ?? [];
        if (roleIds.Length == 0)
        {
            return [];
        }

        return await dbContext.Roles
            .AsNoTracking()
            .Where(role => role.IsActive && roleIds.Contains(role.Id))
            .Where(role => role.NormalizedName != Constants.NormalizedSuperAdministrator)
            .Select(role => role.Id)
            .ToListAsync(cancellationToken);
    }
}
