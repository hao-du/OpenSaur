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

    public async Task<IReadOnlyDictionary<int, bool>> HasPermissionsAsync(
        CurrentUserContext currentUserContext,
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

        var permissionSnapshot = await GetPermissionSnapshotAsync(currentUserContext, cancellationToken);
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

    public async Task<IReadOnlyDictionary<PermissionCode, bool>> HasPermissionsAsync(
        CurrentUserContext currentUserContext,
        PermissionCode[] requiredPermissionCodes,
        CancellationToken cancellationToken = default)
    {
        var permissions = await HasPermissionsAsync(
            currentUserContext,
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

    public async Task<bool> HasPermissionAsync(
        CurrentUserContext currentUserContext,
        int requiredCodeId,
        CancellationToken cancellationToken = default)
    {
        var permissions = await HasPermissionsAsync(currentUserContext, [requiredCodeId], cancellationToken);

        return permissions[requiredCodeId];
    }

    public Task<bool> HasPermissionAsync(
        Guid userId,
        PermissionCode requiredPermissionCode,
        CancellationToken cancellationToken = default)
    {
        return HasPermissionAsync(userId, (int)requiredPermissionCode, cancellationToken);
    }

    public Task<bool> HasPermissionAsync(
        CurrentUserContext currentUserContext,
        PermissionCode requiredPermissionCode,
        CancellationToken cancellationToken = default)
    {
        return HasPermissionAsync(currentUserContext, (int)requiredPermissionCode, cancellationToken);
    }

    public async Task<bool> CanManageWorkspaceAsync(
        ClaimsPrincipal principal,
        Guid targetWorkspaceId,
        int requiredCodeId,
        CancellationToken cancellationToken = default)
    {
        var currentUserContext = CurrentUserContext.Create(principal);
        if (currentUserContext is null)
        {
            return false;
        }

        var permissionSnapshot = await GetPermissionSnapshotAsync(currentUserContext, cancellationToken);
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

    private Task<PermissionSnapshot> GetPermissionSnapshotAsync(Guid userId, CancellationToken cancellationToken)
    {
        return GetPermissionSnapshotCoreAsync(userId, workspaceId: null, cancellationToken);
    }

    private Task<PermissionSnapshot> GetPermissionSnapshotAsync(CurrentUserContext currentUserContext, CancellationToken cancellationToken)
    {
        return GetPermissionSnapshotCoreAsync(
            currentUserContext.UserId,
            currentUserContext.WorkspaceId,
            cancellationToken);
    }

    private async Task<PermissionSnapshot> GetPermissionSnapshotCoreAsync(
        Guid userId,
        Guid? workspaceId,
        CancellationToken cancellationToken)
    {
        var assignedRoles = await _dbContext.UserRoles
            .AsNoTracking()
            .Where(userRole => userRole.UserId == userId && userRole.IsActive)
            .Join(
                _dbContext.Roles.AsNoTracking().Where(role => role.IsActive),
                userRole => userRole.RoleId,
                role => role.Id,
                (_, role) => new AssignedRole(
                    role.Id,
                    role.NormalizedName ?? string.Empty))
            .ToListAsync(cancellationToken);

        if (assignedRoles.Count == 0)
        {
            return PermissionSnapshot.Empty;
        }

        IReadOnlyCollection<AssignedRole> effectiveRoles = assignedRoles;
        if (workspaceId.HasValue)
        {
            var activeWorkspaceRoleIds = await _dbContext.WorkspaceRoles
                .AsNoTracking()
                .Where(workspaceRole => workspaceRole.WorkspaceId == workspaceId.Value && workspaceRole.IsActive)
                .Select(workspaceRole => workspaceRole.RoleId)
                .ToHashSetAsync(cancellationToken);

            effectiveRoles = assignedRoles
                .Where(role =>
                    SystemRoles.IsSuperAdministratorValue(role.RoleNormalizedName)
                    || activeWorkspaceRoleIds.Contains(role.RoleId))
                .ToArray();
        }

        if (effectiveRoles.Count == 0)
        {
            return PermissionSnapshot.Empty;
        }

        if (effectiveRoles.Any(role => SystemRoles.IsSuperAdministratorValue(role.RoleNormalizedName)))
        {
            return PermissionSnapshot.SuperAdministrator;
        }

        var effectiveRoleIds = effectiveRoles
            .Select(role => role.RoleId)
            .Distinct()
            .ToArray();
        var directlyAssignedPermissions = await GetDirectlyAssignedPermissionsAsync(effectiveRoleIds, cancellationToken);
        if (directlyAssignedPermissions.Length == 0)
        {
            return PermissionSnapshot.Empty;
        }

        var grantedCodeIds = await ExpandGrantedPermissionCodeIdsAsync(directlyAssignedPermissions, cancellationToken);

        return new PermissionSnapshot(false, grantedCodeIds);
    }

    private Task<PermissionMetadata[]> GetDirectlyAssignedPermissionsAsync(
        Guid[] effectiveRoleIds,
        CancellationToken cancellationToken)
    {
        return _dbContext.RolePermissions
            .AsNoTracking()
            .Where(rolePermission => rolePermission.IsActive && effectiveRoleIds.Contains(rolePermission.RoleId))
            .Join(
                _dbContext.Permissions.AsNoTracking().Where(permission => permission.IsActive),
                rolePermission => rolePermission.PermissionId,
                permission => permission.Id,
                (_, permission) => new PermissionMetadata(
                    permission.CodeId,
                    permission.PermissionScopeId,
                    permission.Rank))
            .Distinct()
            .ToArrayAsync(cancellationToken);
    }

    private async Task<HashSet<int>> ExpandGrantedPermissionCodeIdsAsync(
        IReadOnlyCollection<PermissionMetadata> directlyAssignedPermissions,
        CancellationToken cancellationToken)
    {
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

        return directlyAssignedPermissions
            .SelectMany(
                assignedPermission => activePermissions.Where(
                    candidate =>
                        candidate.PermissionScopeId == assignedPermission.PermissionScopeId
                        && candidate.Rank <= assignedPermission.Rank))
            .Select(candidate => candidate.CodeId)
            .ToHashSet();
    }

    private sealed record AssignedRole(Guid RoleId, string RoleNormalizedName);

    private sealed record PermissionMetadata(int CodeId, Guid PermissionScopeId, int Rank);

    private sealed record PermissionSnapshot(bool IsSuperAdministrator, HashSet<int> GrantedCodeIds)
    {
        public static PermissionSnapshot Empty { get; } = new(false, []);

        public static PermissionSnapshot SuperAdministrator { get; } = new(true, []);
    }
}
