using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Domain.Permissions;
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

    public async Task ApplyRolePermissionsAsync(
        Guid roleId,
        IEnumerable<Permission> selectedPermissions,
        string roleName,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var permissions = selectedPermissions.ToArray();
        var selectedPermissionIds = permissions.Select(permission => permission.Id).ToHashSet();
        var existingAssignments = await dbContext.RolePermissions
            .Where(rolePermission => rolePermission.RoleId == roleId)
            .ToListAsync(cancellationToken);

        foreach (var assignment in existingAssignments)
        {
            var nextIsActive = selectedPermissionIds.Contains(assignment.PermissionId);
            if (assignment.IsActive == nextIsActive)
            {
                continue;
            }

            assignment.IsActive = nextIsActive;
            assignment.UpdatedBy = currentUserId;
        }

        var existingPermissionIds = existingAssignments
            .Select(assignment => assignment.PermissionId)
            .ToHashSet();

        foreach (var permission in permissions)
        {
            if (existingPermissionIds.Contains(permission.Id))
            {
                continue;
            }

            dbContext.RolePermissions.Add(new RolePermission
            {
                RoleId = roleId,
                PermissionId = permission.Id,
                Description = $"Assigned {permission.Name} to role {roleName}.",
                CreatedBy = currentUserId
            });
        }
    }
}
