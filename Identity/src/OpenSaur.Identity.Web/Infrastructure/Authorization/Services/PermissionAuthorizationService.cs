using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Authorization.Services;

public sealed class PermissionAuthorizationService
{
    private readonly ApplicationDbContext _dbContext;

    public PermissionAuthorizationService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyDictionary<int, bool>> HasPermissionsAsync(
        Guid userId,
        int[] requiredCodeIds,
        CancellationToken cancellationToken = default)
    {
        var distinctRequiredCodeIds = requiredCodeIds
            .Distinct()
            .ToArray();

        if (distinctRequiredCodeIds.Length == 0)
        {
            return new Dictionary<int, bool>();
        }

        var permissionSnapshot = await GetPermissionSnapshotAsync(userId, cancellationToken);
        if (permissionSnapshot.IsSuperAdministrator)
        {
            return distinctRequiredCodeIds.ToDictionary(codeId => codeId, static _ => true);
        }

        return distinctRequiredCodeIds.ToDictionary(
            codeId => codeId,
            codeId => permissionSnapshot.GrantedCodeIds.Contains(codeId));
    }

    public async Task<IReadOnlyDictionary<PermissionCode, bool>> HasPermissionsAsync(
        Guid userId,
        PermissionCode[] requiredPermissionCodes,
        CancellationToken cancellationToken = default)
    {
        var permissions = await HasPermissionsAsync(
            userId,
            requiredPermissionCodes.Select(static permissionCode => (int)permissionCode).ToArray(),
            cancellationToken);

        return requiredPermissionCodes
            .Distinct()
            .ToDictionary(
                permissionCode => permissionCode,
                permissionCode => permissions[(int)permissionCode]);
    }

    public async Task<bool> HasPermissionAsync(
        Guid userId,
        int requiredCodeId,
        CancellationToken cancellationToken = default)
    {
        var permissions = await HasPermissionsAsync(userId, [requiredCodeId], cancellationToken);

        return permissions[requiredCodeId];
    }

    public Task<bool> HasPermissionAsync(
        Guid userId,
        PermissionCode requiredPermissionCode,
        CancellationToken cancellationToken = default)
    {
        return HasPermissionAsync(userId, (int)requiredPermissionCode, cancellationToken);
    }

    public async Task<bool> CanManageWorkspaceAsync(
        ClaimsPrincipal principal,
        Guid targetWorkspaceId,
        int requiredCodeId,
        CancellationToken cancellationToken = default)
    {
        var userId = principal.FindFirstValue(ApplicationClaimTypes.Subject)
                     ?? principal.FindFirstValue(ApplicationClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var parsedUserId))
        {
            return false;
        }

        var permissionSnapshot = await GetPermissionSnapshotAsync(parsedUserId, cancellationToken);
        if (permissionSnapshot.IsSuperAdministrator)
        {
            return true;
        }

        var workspaceIdClaim = principal.FindFirstValue(ApplicationClaimTypes.WorkspaceId);
        if (!Guid.TryParse(workspaceIdClaim, out var callerWorkspaceId) || callerWorkspaceId != targetWorkspaceId)
        {
            return false;
        }

        return permissionSnapshot.GrantedCodeIds.Contains(requiredCodeId);
    }

    public Task<bool> CanManageWorkspaceAsync(
        ClaimsPrincipal principal,
        Guid targetWorkspaceId,
        PermissionCode requiredPermissionCode,
        CancellationToken cancellationToken = default)
    {
        return CanManageWorkspaceAsync(principal, targetWorkspaceId, (int)requiredPermissionCode, cancellationToken);
    }

    private async Task<PermissionSnapshot> GetPermissionSnapshotAsync(Guid userId, CancellationToken cancellationToken)
    {
        var permissionRows = await _dbContext.UserRoles
            .AsNoTracking()
            .Where(userRole => userRole.UserId == userId && userRole.IsActive)
            .Join(
                _dbContext.Roles.AsNoTracking().Where(role => role.IsActive),
                userRole => userRole.RoleId,
                role => role.Id,
                (userRole, role) => new
                {
                    RoleId = role.Id,
                    RoleName = role.Name ?? string.Empty
                })
            .SelectMany(
                role => _dbContext.RolePermissions
                    .AsNoTracking()
                    .Where(rolePermission => rolePermission.IsActive && rolePermission.RoleId == role.RoleId)
                    .Join(
                        _dbContext.Permissions.AsNoTracking().Where(permission => permission.IsActive),
                        rolePermission => rolePermission.PermissionId,
                        permission => permission.Id,
                        (_, permission) => new
                        {
                            CodeId = (int?)permission.CodeId,
                            PermissionScopeId = (Guid?)permission.PermissionScopeId,
                            Rank = (int?)permission.Rank
                        })
                    .DefaultIfEmpty(),
                (role, permission) => new PermissionRow(
                    role.RoleName,
                    permission == null
                    || !permission.CodeId.HasValue
                    || !permission.PermissionScopeId.HasValue
                    || !permission.Rank.HasValue
                        ? null
                        : new PermissionMetadata(
                            permission.CodeId.Value,
                            permission.PermissionScopeId.Value,
                            permission.Rank.Value)))
            .ToListAsync(cancellationToken);

        if (permissionRows.Count == 0)
        {
            return PermissionSnapshot.Empty;
        }

        if (permissionRows.Any(role => role.RoleName == SystemRoles.SuperAdministrator))
        {
            return PermissionSnapshot.SuperAdministrator;
        }

        var directlyAssignedPermissions = permissionRows
            .Where(row => row.Permission is not null)
            .Select(row => row.Permission!)
            .Distinct()
            .ToArray();

        if (directlyAssignedPermissions.Length == 0)
        {
            return PermissionSnapshot.Empty;
        }

        var relevantPermissionScopeIds = directlyAssignedPermissions
            .Select(permission => permission.PermissionScopeId)
            .Distinct()
            .ToArray();

        var activePermissions = await _dbContext.Permissions
            .AsNoTracking()
            .Where(permission => permission.IsActive && relevantPermissionScopeIds.Contains(permission.PermissionScopeId))
            .Select(permission => new PermissionMetadata(
                permission.CodeId,
                permission.PermissionScopeId,
                permission.Rank))
            .ToListAsync(cancellationToken);

        var grantedCodeIds = directlyAssignedPermissions
            .SelectMany(
                assignedPermission => activePermissions.Where(
                    candidate =>
                        candidate.PermissionScopeId == assignedPermission.PermissionScopeId
                        && candidate.Rank <= assignedPermission.Rank))
            .Select(candidate => candidate.CodeId)
            .ToHashSet();

        return new PermissionSnapshot(false, grantedCodeIds);
    }

    private sealed record PermissionRow(string RoleName, PermissionMetadata? Permission);

    private sealed record PermissionMetadata(int CodeId, Guid PermissionScopeId, int Rank);

    private sealed record PermissionSnapshot(bool IsSuperAdministrator, HashSet<int> GrantedCodeIds)
    {
        public static PermissionSnapshot Empty { get; } = new(false, []);

        public static PermissionSnapshot SuperAdministrator { get; } = new(true, []);
    }
}
