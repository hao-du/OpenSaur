using Microsoft.EntityFrameworkCore;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Domain.Permissions;
using OpenSaur.CoreGate.Web.Infrastructure.Database;

namespace OpenSaur.CoreGate.Web.Infrastructure.Security;

public sealed class UserAuthorizationDataService(ApplicationDbContext dbContext)
{
    public async Task<IReadOnlyCollection<string>> GetActiveNormalizedRoleNamesForUserAsync(
        Guid userId,
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        var assignedRoles = await dbContext.UserRoles
            .AsNoTracking()
            .Where(userRole => userRole.UserId == userId && userRole.IsActive)
            .Join(
                dbContext.Roles.AsNoTracking().Where(role => role.IsActive),
                userRole => userRole.RoleId,
                role => role.Id,
                (_, role) => new AssignedRole(role.Id, role.NormalizedName ?? string.Empty))
            .ToListAsync(cancellationToken);

        if (assignedRoles.Count == 0)
        {
            return [];
        }

        var activeWorkspaceRoleIds = await dbContext.WorkspaceRoles
            .AsNoTracking()
            .Where(workspaceRole => workspaceRole.WorkspaceId == workspaceId && workspaceRole.IsActive)
            .Select(workspaceRole => workspaceRole.RoleId)
            .ToHashSetAsync(cancellationToken);

        return assignedRoles
            .Where(role => SystemRoles.IsSuperAdministratorValue(role.NormalizedName) || activeWorkspaceRoleIds.Contains(role.RoleId))
            .Select(role => role.NormalizedName)
            .Where(static role => !string.IsNullOrWhiteSpace(role))
            .Distinct(StringComparer.Ordinal)
            .ToArray();
    }

    public async Task<IReadOnlyCollection<string>> GetGrantedPermissionCodesAsync(
        Guid userId,
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        var assignedRoles = await dbContext.UserRoles
            .AsNoTracking()
            .Where(userRole => userRole.UserId == userId && userRole.IsActive)
            .Join(
                dbContext.Roles.AsNoTracking().Where(role => role.IsActive),
                userRole => userRole.RoleId,
                role => role.Id,
                (_, role) => new AssignedRole(role.Id, role.NormalizedName ?? string.Empty))
            .ToListAsync(cancellationToken);

        if (assignedRoles.Count == 0)
        {
            return [];
        }

        if (assignedRoles.Any(role => SystemRoles.IsSuperAdministratorValue(role.NormalizedName)))
        {
            return await dbContext.Permissions
                .AsNoTracking()
                .Where(permission => permission.IsActive)
                .OrderBy(permission => permission.PermissionScopeId)
                .ThenByDescending(permission => permission.Rank)
                .ThenBy(permission => permission.Code)
                .Select(permission => permission.Code)
                .ToArrayAsync(cancellationToken);
        }

        var activeWorkspaceRoleIds = await dbContext.WorkspaceRoles
            .AsNoTracking()
            .Where(workspaceRole => workspaceRole.WorkspaceId == workspaceId && workspaceRole.IsActive)
            .Select(workspaceRole => workspaceRole.RoleId)
            .ToHashSetAsync(cancellationToken);

        var effectiveRoleIds = assignedRoles
            .Where(role => activeWorkspaceRoleIds.Contains(role.RoleId))
            .Select(role => role.RoleId)
            .Distinct()
            .ToArray();

        if (effectiveRoleIds.Length == 0)
        {
            return [];
        }

        var directlyAssignedPermissions = await dbContext.RolePermissions
            .AsNoTracking()
            .Where(rolePermission => rolePermission.IsActive && effectiveRoleIds.Contains(rolePermission.RoleId))
            .Join(
                dbContext.Permissions.AsNoTracking().Where(permission => permission.IsActive),
                rolePermission => rolePermission.PermissionId,
                permission => permission.Id,
                (_, permission) => new PermissionMetadata(permission.Code, permission.PermissionScopeId, permission.Rank))
            .Distinct()
            .ToArrayAsync(cancellationToken);

        if (directlyAssignedPermissions.Length == 0)
        {
            return [];
        }

        var scopeIds = directlyAssignedPermissions
            .Select(permission => permission.PermissionScopeId)
            .Distinct()
            .ToArray();

        var activePermissions = await dbContext.Permissions
            .AsNoTracking()
            .Where(permission => permission.IsActive && scopeIds.Contains(permission.PermissionScopeId))
            .Select(permission => new PermissionMetadata(permission.Code, permission.PermissionScopeId, permission.Rank))
            .ToListAsync(cancellationToken);

        return directlyAssignedPermissions
            .SelectMany(
                assigned => activePermissions.Where(
                    candidate => candidate.PermissionScopeId == assigned.PermissionScopeId
                                 && candidate.Rank <= assigned.Rank))
            .Select(candidate => candidate.Code)
            .Distinct(StringComparer.Ordinal)
            .OrderBy(static code => code, StringComparer.Ordinal)
            .ToArray();
    }

    private sealed record AssignedRole(Guid RoleId, string NormalizedName);

    private sealed record PermissionMetadata(string Code, Guid PermissionScopeId, int Rank);
}
