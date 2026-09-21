using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Domain.Permissions;
using OpenSaur.CoreGate.Web.Features.Auth.Dtos;
using OpenSaur.CoreGate.Web.Infrastructure.Caching;
using OpenSaur.CoreGate.Web.Infrastructure.Database;

namespace OpenSaur.CoreGate.Web.Features.Auth.Services;

public sealed class UserRolePermissionService(
    ApplicationDbContext dbContext,
    ICacheService cacheService
)
{
    public async Task<bool> CanImpersonateAsync(Guid actorUserId, CancellationToken cancellationToken)
    {
        var cacheKey = CacheKeys.UserCanImpersonate(actorUserId);

        return await cacheService.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                var roles = await dbContext.UserRoles
                    .AsNoTracking()
                    .Where(userRole => userRole.UserId == actorUserId && userRole.IsActive)
                    .Join(
                        dbContext.Roles.AsNoTracking().Where(role => role.IsActive),
                        userRole => userRole.RoleId,
                        role => role.Id,
                        (_, role) => role.NormalizedName)
                    .ToListAsync(ct);

                return roles.Any(SystemRoles.IsSuperAdministratorValue);
            },
            tags: [CacheKeys.Tags.User(actorUserId)],
            cancellationToken: cancellationToken);
    }

    public async Task<IReadOnlyCollection<string>> GetActiveNormalizedRoleNamesForUserAsync(
        Guid userId,
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        var cacheKey = CacheKeys.UserWorkspaceRoles(userId, workspaceId);

        return await cacheService.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                var assignedRoles = await dbContext.UserRoles
                    .AsNoTracking()
                    .Where(userRole => userRole.UserId == userId && userRole.IsActive)
                    .Join(
                        dbContext.Roles.AsNoTracking().Where(role => role.IsActive),
                        userRole => userRole.RoleId,
                        role => role.Id,
                        (_, role) => new AssignedRole(role.Id, role.NormalizedName ?? string.Empty))
                    .ToListAsync(ct);

                if (assignedRoles.Count == 0)
                {
                    return (IReadOnlyCollection<string>)[];
                }

                var activeWorkspaceRoleIds = await dbContext.WorkspaceRoles
                    .AsNoTracking()
                    .Where(workspaceRole => workspaceRole.WorkspaceId == workspaceId && workspaceRole.IsActive)
                    .Select(workspaceRole => workspaceRole.RoleId)
                    .ToHashSetAsync(ct);

                return assignedRoles
                    .Where(role => SystemRoles.IsSuperAdministratorValue(role.NormalizedName) || activeWorkspaceRoleIds.Contains(role.RoleId))
                    .Select(role => role.NormalizedName)
                    .Where(static role => !string.IsNullOrWhiteSpace(role))
                    .Distinct(StringComparer.Ordinal)
                    .ToArray();
            },
            tags: [CacheKeys.Tags.User(userId), CacheKeys.Tags.Workspace(workspaceId)],
            cancellationToken: cancellationToken);
    }

    public async Task<IReadOnlyCollection<string>> GetGrantedPermissionCodesAsync(
        Guid userId,
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        var cacheKey = CacheKeys.UserWorkspacePermissions(userId, workspaceId);

        return await cacheService.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                var assignedRoles = await dbContext.UserRoles
                    .AsNoTracking()
                    .Where(userRole => userRole.UserId == userId && userRole.IsActive)
                    .Join(
                        dbContext.Roles.AsNoTracking().Where(role => role.IsActive),
                        userRole => userRole.RoleId,
                        role => role.Id,
                        (_, role) => new AssignedRole(role.Id, role.NormalizedName ?? string.Empty))
                    .ToListAsync(ct);

                if (assignedRoles.Count == 0)
                {
                    return (IReadOnlyCollection<string>)[];
                }

                if (assignedRoles.Any(role => SystemRoles.IsSuperAdministratorValue(role.NormalizedName)))
                {
                    return (IReadOnlyCollection<string>)await dbContext.Permissions
                        .AsNoTracking()
                        .Where(permission => permission.IsActive)
                        .OrderBy(permission => permission.PermissionScopeId)
                        .ThenByDescending(permission => permission.Rank)
                        .ThenBy(permission => permission.Code)
                        .Select(permission => permission.Code)
                        .ToArrayAsync(ct);
                }

                var activeWorkspaceRoleIds = await dbContext.WorkspaceRoles
                    .AsNoTracking()
                    .Where(workspaceRole => workspaceRole.WorkspaceId == workspaceId && workspaceRole.IsActive)
                    .Select(workspaceRole => workspaceRole.RoleId)
                    .ToHashSetAsync(ct);

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
                    .ToArrayAsync(ct);

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
                    .ToListAsync(ct);

                return directlyAssignedPermissions
                    .SelectMany(
                        assigned => activePermissions.Where(
                            candidate => candidate.PermissionScopeId == assigned.PermissionScopeId
                                         && candidate.Rank <= assigned.Rank))
                    .Select(candidate => candidate.Code)
                    .Distinct(StringComparer.Ordinal)
                    .OrderBy(static code => code, StringComparer.Ordinal)
                    .ToArray();
            },
            tags: [CacheKeys.Tags.User(userId), CacheKeys.Tags.Workspace(workspaceId)],
            cancellationToken: cancellationToken);
    }

    private sealed record AssignedRole(Guid RoleId, string NormalizedName);

    private sealed record PermissionMetadata(string Code, Guid PermissionScopeId, int Rank);
}
