using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Roles.GetRoleById;

public static class GetRoleByIdHandler
{
    public static async Task<Results<Ok<GetRoleByIdResponse>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var role = await dbContext.Roles
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (role is null)
        {
            return AppHttpResults.NotFound("Role not found.", "No role matched the provided identifier.");
        }

        var permissionCodes = await dbContext.RolePermissions
            .AsNoTracking()
            .Include(rolePermission => rolePermission.Permission)
            .Where(rolePermission => rolePermission.RoleId == id && rolePermission.IsActive)
            .Select(rolePermission => rolePermission.Permission!.Code)
            .OrderBy(code => code)
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(new GetRoleByIdResponse(
            role.Id,
            role.Name ?? string.Empty,
            role.NormalizedName ?? string.Empty,
            role.Description,
            role.IsActive,
            permissionCodes));
    }
}
