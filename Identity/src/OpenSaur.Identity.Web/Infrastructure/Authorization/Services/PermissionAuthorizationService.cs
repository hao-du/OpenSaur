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

    public async Task<IReadOnlyDictionary<string, bool>> HasPermissionsAsync(
        Guid userId,
        string[] requiredPermissionCodes,
        CancellationToken cancellationToken = default)
    {
        var distinctRequiredCodes = requiredPermissionCodes
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        if (distinctRequiredCodes.Length == 0)
        {
            return new Dictionary<string, bool>(StringComparer.Ordinal);
        }

        var permissionSnapshot = await GetPermissionSnapshotAsync(userId, cancellationToken);
        if (permissionSnapshot.IsSuperAdministrator)
        {
            return distinctRequiredCodes.ToDictionary(code => code, static _ => true, StringComparer.Ordinal);
        }

        return distinctRequiredCodes.ToDictionary(
            code => code,
            code => permissionSnapshot.GrantedCodes.Contains(code),
            StringComparer.Ordinal);
    }

    public async Task<IReadOnlyDictionary<string, bool>> HasPermissionsAsync(
        CurrentUserContext currentUserContext,
        string[] requiredPermissionCodes,
        CancellationToken cancellationToken = default)
    {
        var distinctRequiredCodes = requiredPermissionCodes
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        if (distinctRequiredCodes.Length == 0)
        {
            return new Dictionary<string, bool>(StringComparer.Ordinal);
        }

        var permissionSnapshot = await GetPermissionSnapshotAsync(currentUserContext, cancellationToken);
        if (permissionSnapshot.IsSuperAdministrator)
        {
            return distinctRequiredCodes.ToDictionary(code => code, static _ => true, StringComparer.Ordinal);
        }

        return distinctRequiredCodes.ToDictionary(
            code => code,
            code => permissionSnapshot.GrantedCodes.Contains(code),
            StringComparer.Ordinal);
    }

    public async Task<bool> HasPermissionAsync(
        Guid userId,
        string requiredPermissionCode,
        CancellationToken cancellationToken = default)
    {
        var permissions = await HasPermissionsAsync(userId, [requiredPermissionCode], cancellationToken);

        return permissions[requiredPermissionCode];
    }

    public async Task<bool> HasPermissionAsync(
        CurrentUserContext currentUserContext,
        string requiredPermissionCode,
        CancellationToken cancellationToken = default)
    {
        var permissions = await HasPermissionsAsync(currentUserContext, [requiredPermissionCode], cancellationToken);

        return permissions[requiredPermissionCode];
    }

    public async Task<bool> CanManageWorkspaceAsync(
        ClaimsPrincipal principal,
        Guid targetWorkspaceId,
        string requiredPermissionCode,
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

        return permissionSnapshot.GrantedCodes.Contains(requiredPermissionCode);
    }

    public Task<IReadOnlyCollection<string>> GetGrantedPermissionCodesAsync(
        Guid userId,
        Guid? workspaceId,
        CancellationToken cancellationToken = default)
    {
        return GetGrantedPermissionCodesCoreAsync(userId, workspaceId, cancellationToken);
    }

    public Task<IReadOnlyCollection<string>> GetGrantedPermissionCodesAsync(
        CurrentUserContext currentUserContext,
        CancellationToken cancellationToken = default)
    {
        return GetGrantedPermissionCodesCoreAsync(
            currentUserContext.UserId,
            currentUserContext.WorkspaceId,
            cancellationToken);
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

        var grantedCodes = await ExpandGrantedPermissionCodesAsync(directlyAssignedPermissions, cancellationToken);

        return new PermissionSnapshot(false, grantedCodes);
    }

    private async Task<IReadOnlyCollection<string>> GetGrantedPermissionCodesCoreAsync(
        Guid userId,
        Guid? workspaceId,
        CancellationToken cancellationToken)
    {
        var permissionSnapshot = await GetPermissionSnapshotCoreAsync(userId, workspaceId, cancellationToken);
        IQueryable<Permission> query = _dbContext.Permissions
            .AsNoTracking()
            .Where(permission => permission.IsActive);

        if (!permissionSnapshot.IsSuperAdministrator)
        {
            if (permissionSnapshot.GrantedCodes.Count == 0)
            {
                return Array.Empty<string>();
            }

            query = query.Where(permission => permissionSnapshot.GrantedCodes.Contains(permission.Code));
        }

        return await query
            .OrderBy(permission => permission.PermissionScopeId)
            .ThenByDescending(permission => permission.Rank)
            .ThenBy(permission => permission.Code)
            .Select(permission => permission.Code)
            .Distinct()
            .ToArrayAsync(cancellationToken);
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
                    permission.Code,
                    permission.PermissionScopeId,
                    permission.Rank))
            .Distinct()
            .ToArrayAsync(cancellationToken);
    }

    private async Task<HashSet<string>> ExpandGrantedPermissionCodesAsync(
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
                permission.Code,
                permission.PermissionScopeId,
                permission.Rank))
            .ToListAsync(cancellationToken);

        return directlyAssignedPermissions
            .SelectMany(
                assignedPermission => activePermissions.Where(
                    candidate =>
                        candidate.PermissionScopeId == assignedPermission.PermissionScopeId
                        && candidate.Rank <= assignedPermission.Rank))
            .Select(candidate => candidate.Code)
            .ToHashSet(StringComparer.Ordinal);
    }

    private sealed record AssignedRole(Guid RoleId, string RoleNormalizedName);

    private sealed record PermissionMetadata(string Code, Guid PermissionScopeId, int Rank);

    private sealed record PermissionSnapshot(bool IsSuperAdministrator, HashSet<string> GrantedCodes)
    {
        public static PermissionSnapshot Empty { get; } = new(false, new HashSet<string>(StringComparer.Ordinal));

        public static PermissionSnapshot SuperAdministrator { get; } = new(true, new HashSet<string>(StringComparer.Ordinal));
    }
}
