using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions;

public sealed class PermissionRepository(ApplicationDbContext dbContext)
{
    public async Task<Result<GetPermissionsResponse>> GetPermissionsAsync(
        GetPermissionsRequest request,
        CancellationToken cancellationToken)
    {
        var permissions = await dbContext.Permissions
            .AsNoTracking()
            .Include(permission => permission.PermissionScope)
            .OrderBy(permission => permission.PermissionScopeId)
            .ThenByDescending(permission => permission.Rank)
            .ThenBy(permission => permission.Code)
            .ToListAsync(cancellationToken);

        return Result<GetPermissionsResponse>.Success(new GetPermissionsResponse(permissions));
    }

    public async Task<Result<GetPermissionByCodeResponse>> GetPermissionByCodeAsync(
        GetPermissionByCodeRequest request,
        CancellationToken cancellationToken)
    {
        var permission = await dbContext.Permissions
            .AsNoTracking()
            .Include(candidate => candidate.PermissionScope)
            .SingleOrDefaultAsync(candidate => candidate.Code == request.Code, cancellationToken);

        return permission is null
            ? Result<GetPermissionByCodeResponse>.NotFound(
                "Permission not found.",
                "No permission matched the provided code.")
            : Result<GetPermissionByCodeResponse>.Success(new GetPermissionByCodeResponse(permission));
    }

    public async Task<Result<GetActivePermissionsByCodesResponse>> GetActivePermissionsByCodesAsync(
        GetActivePermissionsByCodesRequest request,
        CancellationToken cancellationToken)
    {
        var permissions = await dbContext.Permissions
            .Where(permission => permission.IsActive && request.Codes.Contains(permission.Code))
            .ToListAsync(cancellationToken);

        return Result<GetActivePermissionsByCodesResponse>.Success(new GetActivePermissionsByCodesResponse(permissions));
    }

    public async Task<Result<GetActivePermissionsForRoleResponse>> GetActivePermissionsForRoleAsync(
        GetActivePermissionsForRoleRequest request,
        CancellationToken cancellationToken)
    {
        var permissions = await dbContext.RolePermissions
            .AsNoTracking()
            .Where(rolePermission => rolePermission.RoleId == request.RoleId && rolePermission.IsActive)
            .Join(
                dbContext.Permissions.AsNoTracking().Where(permission => permission.IsActive),
                rolePermission => rolePermission.PermissionId,
                permission => permission.Id,
                (_, permission) => permission)
            .OrderBy(permission => permission.PermissionScopeId)
            .ThenByDescending(permission => permission.Rank)
            .ThenBy(permission => permission.Code)
            .ToListAsync(cancellationToken);

        return Result<GetActivePermissionsForRoleResponse>.Success(new GetActivePermissionsForRoleResponse(permissions));
    }
}
