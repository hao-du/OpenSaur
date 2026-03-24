using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Database;

namespace OpenSaur.Identity.Web.Features.Roles.GetRoleById;

public static class GetRoleByIdHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var role = await dbContext.Roles
            .AsNoTracking()
            .Where(candidate => candidate.Id == id)
            .Select(role => new
            {
                role.Id,
                Name = role.Name ?? string.Empty,
                role.Description,
                role.IsActive
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (role is null)
        {
            return Results.NotFound();
        }

        var permissionCodeIds = await dbContext.RolePermissions
            .AsNoTracking()
            .Where(rolePermission => rolePermission.RoleId == id && rolePermission.IsActive)
            .Join(
                dbContext.Permissions.AsNoTracking().Where(permission => permission.IsActive),
                rolePermission => rolePermission.PermissionId,
                permission => permission.Id,
                (_, permission) => permission.CodeId)
            .OrderBy(codeId => codeId)
            .ToArrayAsync(cancellationToken);

        return Results.Ok(
            new GetRoleByIdResponse(
                role.Id,
                role.Name,
                role.Description,
                role.IsActive,
                permissionCodeIds));
    }
}
